from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from typing import Any

from .config import get_settings
from .models import NamedCategory, ParseVehicleDetailsResponse, RunningCosts

FEATURE_DEFAULTS = [
    "Audio and Communications",
    "Drivers Assistance",
    "Exterior",
    "Illumination",
    "Interior",
    "Performance",
    "Safety and Security",
]

SPEC_DEFAULTS = [
    "Performance",
    "Size and dimensions",
]

SYSTEM_PROMPT = """You extract structured used-car listing details from pasted dealer/AutoTrader text.
Return ONLY valid JSON matching this shape (no markdown):
{
  "featureCategories": [{"name": string, "items": string[]}],
  "specCategories": [{"name": string, "items": string[]}],
  "runningCosts": {
    "mpgUrban": number|null,
    "mpgExtraUrban": number|null,
    "mpgAverage": number|null,
    "roadTaxPerYear": number|null
  }
}
Rules:
- Prefer these feature category names when possible: Audio and Communications, Drivers Assistance, Exterior, Illumination, Interior, Performance, Safety and Security.
- Prefer these spec category names when possible: Performance, Size and dimensions.
- Put each feature/spec bullet as a short string item under the best matching category.
- Spec items may be "Label: value" strings when both are present.
- Extract MPG numbers (urban / extra urban / average) and road tax £ per year when present.
- Omit empty categories. Use null for unknown running-cost fields.
- Do not invent equipment not present in the text.
"""


class GeminiError(Exception):
    pass


def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if not match:
        raise GeminiError("Gemini response did not contain JSON")
    parsed = json.loads(match.group(0))
    if not isinstance(parsed, dict):
        raise GeminiError("Gemini JSON root must be an object")
    return parsed


def _normalize_categories(raw: Any) -> list[NamedCategory]:
    if not isinstance(raw, list):
        return []
    result: list[NamedCategory] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        items_raw = item.get("items") or []
        items = [
            str(entry).strip()
            for entry in (items_raw if isinstance(items_raw, list) else [])
            if str(entry).strip()
        ]
        if items:
            result.append(NamedCategory(name=name, items=items))
    return result


def _normalize_running_costs(raw: Any) -> RunningCosts | None:
    if raw is None or not isinstance(raw, dict):
        return None
    costs = RunningCosts.model_validate(raw)
    if all(
        value is None
        for value in (
            costs.mpgUrban,
            costs.mpgExtraUrban,
            costs.mpgAverage,
            costs.roadTaxPerYear,
        )
    ):
        return None
    return costs


def parse_vehicle_details_text(text: str) -> ParseVehicleDetailsResponse:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise GeminiError("GEMINI_API_KEY is not configured")

    trimmed = text.strip()
    if not trimmed:
        raise GeminiError("Paste text is empty")

    model = settings.gemini_model
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={settings.gemini_api_key}"
    )
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": f"{SYSTEM_PROMPT}\n\nListing text:\n{trimmed}",
                    }
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise GeminiError(f"Gemini HTTP {exc.code}: {detail[:400]}") from exc
    except urllib.error.URLError as exc:
        raise GeminiError(f"Gemini request failed: {exc.reason}") from exc

    try:
        parts = body["candidates"][0]["content"]["parts"]
        text_out = "".join(str(part.get("text") or "") for part in parts)
    except (KeyError, IndexError, TypeError) as exc:
        raise GeminiError("Unexpected Gemini response shape") from exc

    parsed = _extract_json(text_out)
    return ParseVehicleDetailsResponse(
        featureCategories=_normalize_categories(parsed.get("featureCategories")),
        specCategories=_normalize_categories(parsed.get("specCategories")),
        runningCosts=_normalize_running_costs(parsed.get("runningCosts")),
    )
