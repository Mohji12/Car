from __future__ import annotations

import json
import re
from typing import Any

from google import genai
from google.genai import types

from .config import get_settings
from .models import SpecItem, VehicleExtractResult

DEALER_FOOTER = (
    "Warranty available from 3, 6, 12 and 24 months. "
    "We accept all major credit / debit cards. P/X welcome."
)

EXTRACT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "make": {"type": "string"},
        "model": {"type": "string"},
        "variant": {"type": "string"},
        "year": {"type": "integer"},
        "price": {"type": "integer"},
        "mileage": {"type": "integer"},
        "fuel": {"type": "string"},
        "transmission": {"type": "string"},
        "bodyType": {"type": "string"},
        "colour": {"type": "string"},
        "location": {"type": "string"},
        "status": {"type": "string", "enum": ["available", "sold"]},
        "tags": {"type": "array", "items": {"type": "string"}},
        "featured": {"type": "boolean"},
        "description": {"type": "string"},
        "highlights": {"type": "array", "items": {"type": "string"}},
        "specs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "label": {"type": "string"},
                    "value": {"type": "string"},
                },
                "required": ["label", "value"],
            },
        },
        "condition": {"type": "string"},
        "doors": {"type": "integer"},
        "engineSize": {"type": "string"},
        "registrationDate": {"type": "string"},
        "registrationPlate": {"type": "string"},
        "owners": {"type": "integer"},
        "serviceHistory": {"type": "string"},
    },
    "required": ["make", "model", "year", "price", "mileage", "description"],
}

SYSTEM_PROMPT = """You extract used-car listing details for a UK dealership (CarWebs Motors, St Albans).
Return JSON only matching the schema.

Rules:
- Prices are GBP integers (no £ symbol). Mileage is miles as an integer.
- Infer make/model/variant/year/fuel/transmission/bodyType/colour when stated or clearly implied.
- Always put owners in specs as {"label":"Owners","value":"<n>"} when known; also return owners as integer.
- description must be a dealer-style paragraph that ALWAYS includes: service history (full/part/unknown),
  mileage with "miles", and number of owners when known. Include MOT, keys, features, HPI clear when present.
  End with: "Warranty available from 3, 6, 12 and 24 months. We accept all major credit / debit cards. P/X welcome."
  unless the source already has an equivalent warranty/cards/P/X sentence.
- highlights: short feature bullets (4–8), not a full paragraph.
- tags: only "new_arrival" and/or "featured" when the text suggests new stock or featured/highlight.
- location default "St Albans", status default "available", condition default "Used".
- If a field is unknown, use empty string, null-equivalent omit, or sensible UK defaults for fuel/transmission/bodyType.
"""


class GeminiExtractError(Exception):
    pass


def _ensure_description(data: dict[str, Any]) -> str:
    desc = (data.get("description") or "").strip()
    mileage = data.get("mileage")
    owners = data.get("owners")
    service = (data.get("serviceHistory") or "").strip()

    if not desc:
        parts: list[str] = []
        if service:
            parts.append(service if "service" in service.lower() else f"{service} service history")
        else:
            parts.append("Service history to confirm")
        if isinstance(mileage, int) and mileage >= 0:
            parts.append(f"{mileage:,} miles")
        if isinstance(owners, int) and owners >= 0:
            parts.append(f"{owners} owner" if owners == 1 else f"{owners} owners")
        for h in data.get("highlights") or []:
            if isinstance(h, str) and h.strip():
                parts.append(h.strip())
        parts.append("HPI clear")
        desc = ", ".join(parts) + f". {DEALER_FOOTER}"
    elif DEALER_FOOTER.lower() not in desc.lower() and "p/x" not in desc.lower():
        desc = f"{desc.rstrip('. ')}. {DEALER_FOOTER}"
    return desc


def _merge_owners_spec(specs: list[SpecItem], owners: Any) -> list[SpecItem]:
    if not isinstance(owners, int) or owners < 0:
        return specs
    without = [s for s in specs if s.label.lower() != "owners"]
    without.append(SpecItem(label="Owners", value=str(owners)))
    return without


def _parse_json_payload(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def extract_vehicle_from_text(text: str) -> VehicleExtractResult:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise GeminiExtractError("GEMINI_API_KEY is not configured")

    cleaned = text.strip()
    if len(cleaned) < 10:
        raise GeminiExtractError("Paste more listing details (at least a short paragraph)")

    client = genai.Client(api_key=settings.gemini_api_key)
    models = [settings.gemini_model, "gemini-2.5-flash", "gemini-flash-latest", "gemini-3.6-flash"]
    tried: set[str] = set()
    response = None
    last_error: Exception | None = None
    for model in models:
        if model in tried:
            continue
        tried.add(model)
        try:
            response = client.models.generate_content(
                model=model,
                contents=f"Extract vehicle listing fields from this text:\n\n{cleaned}",
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=EXTRACT_SCHEMA,
                    temperature=0.2,
                ),
            )
            break
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            err = str(exc)
            if "UNAVAILABLE" in err or "high demand" in err.lower() or "404" in err or "NOT_FOUND" in err:
                continue
            raise GeminiExtractError(f"Gemini request failed: {exc}") from exc

    if response is None:
        raise GeminiExtractError(f"Gemini request failed: {last_error}")

    raw = (response.text or "").strip()
    if not raw:
        raise GeminiExtractError("Gemini returned an empty response")

    try:
        data = _parse_json_payload(raw)
    except json.JSONDecodeError as exc:
        raise GeminiExtractError("Gemini returned invalid JSON") from exc

    specs_raw = data.get("specs") or []
    specs = [
        SpecItem(label=str(item.get("label", "")).strip(), value=str(item.get("value", "")).strip())
        for item in specs_raw
        if isinstance(item, dict) and item.get("label") and item.get("value") is not None
    ]
    specs = _merge_owners_spec(specs, data.get("owners"))

    tags = [
        t
        for t in (data.get("tags") or [])
        if isinstance(t, str) and t in {"new_arrival", "featured"}
    ]
    featured = bool(data.get("featured")) or "featured" in tags

    try:
        return VehicleExtractResult(
            make=str(data.get("make") or "").strip(),
            model=str(data.get("model") or "").strip(),
            variant=str(data.get("variant") or "").strip(),
            year=data.get("year") if isinstance(data.get("year"), int) else None,
            price=data.get("price") if isinstance(data.get("price"), int) else None,
            mileage=data.get("mileage") if isinstance(data.get("mileage"), int) else None,
            fuel=str(data.get("fuel") or "Petrol").strip() or "Petrol",
            transmission=str(data.get("transmission") or "Manual").strip() or "Manual",
            bodyType=str(data.get("bodyType") or "Hatchback").strip() or "Hatchback",
            colour=str(data.get("colour") or "").strip(),
            location=str(data.get("location") or "St Albans").strip() or "St Albans",
            status="sold" if data.get("status") == "sold" else "available",
            tags=tags,
            featured=featured,
            description=_ensure_description(data),
            highlights=[
                str(h).strip()
                for h in (data.get("highlights") or [])
                if str(h).strip()
            ],
            specs=specs,
            condition=str(data.get("condition") or "Used").strip() or "Used",
            doors=data.get("doors") if isinstance(data.get("doors"), int) else None,
            engineSize=(str(data["engineSize"]).strip() if data.get("engineSize") else None),
            registrationDate=(
                str(data["registrationDate"]).strip() if data.get("registrationDate") else None
            ),
            registrationPlate=(
                str(data["registrationPlate"]).strip() if data.get("registrationPlate") else None
            ),
        )
    except Exception as exc:  # noqa: BLE001
        raise GeminiExtractError(f"Could not map Gemini result: {exc}") from exc
