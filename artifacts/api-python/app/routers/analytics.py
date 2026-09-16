from __future__ import annotations

from fastapi import APIRouter, Depends

from ..auth import require_admin
from ..models import AnalyticsSummary
from ..store import get_analytics_summary

router = APIRouter(tags=["analytics"])


@router.get(
    "/analytics/summary",
    response_model=AnalyticsSummary,
    dependencies=[Depends(require_admin)],
)
async def analytics_summary() -> AnalyticsSummary:
    return await get_analytics_summary()
