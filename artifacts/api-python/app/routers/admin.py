from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import require_admin
from ..gemini import GeminiError, parse_vehicle_details_text
from ..models import ParseVehicleDetailsRequest, ParseVehicleDetailsResponse

router = APIRouter(tags=["admin"])


@router.post(
    "/admin/parse-vehicle-details",
    response_model=ParseVehicleDetailsResponse,
    dependencies=[Depends(require_admin)],
)
async def parse_vehicle_details(
    body: ParseVehicleDetailsRequest,
) -> ParseVehicleDetailsResponse:
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Paste text is required"},
        )
    try:
        return await asyncio.to_thread(parse_vehicle_details_text, text)
    except GeminiError as exc:
        message = str(exc)
        code = (
            status.HTTP_400_BAD_REQUEST
            if "not configured" in message or "empty" in message.lower()
            else status.HTTP_502_BAD_GATEWAY
        )
        raise HTTPException(status_code=code, detail={"message": message}) from exc
