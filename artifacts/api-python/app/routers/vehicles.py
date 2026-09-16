from __future__ import annotations

import asyncio
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse, Response

from ..auth import require_admin
from ..models import Vehicle, VehicleInput, VehiclePatch
from ..s3 import S3UploadError, upload_bytes
from ..store import (
    StoreConflictError,
    append_images,
    create_vehicle,
    delete_vehicle,
    get_vehicle,
    list_vehicles,
    update_vehicle,
)

router = APIRouter(tags=["vehicles"])

MAX_FILES = 12
MAX_FILE_SIZE = 8 * 1024 * 1024


@router.get("/vehicles", response_model=list[Vehicle])
async def list_vehicles_route(
    status_filter: str | None = Query(None, alias="status"),
    tag: str | None = None,
    make: str | None = None,
) -> list[Vehicle]:
    return await list_vehicles(status=status_filter, tag=tag, make=make)


@router.get("/vehicles/{vehicle_id}", response_model=Vehicle)
async def get_vehicle_route(vehicle_id: str) -> Vehicle:
    vehicle = await get_vehicle(vehicle_id, increment_view=True)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Vehicle not found"},
        )
    return vehicle


@router.post(
    "/vehicles",
    response_model=Vehicle,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_vehicle_route(body: VehicleInput) -> Vehicle | JSONResponse:
    try:
        return await create_vehicle(body)
    except StoreConflictError as exc:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"message": str(exc)},
        )


@router.patch(
    "/vehicles/{vehicle_id}",
    response_model=Vehicle,
    dependencies=[Depends(require_admin)],
)
async def update_vehicle_route(vehicle_id: str, body: VehiclePatch) -> Vehicle:
    vehicle = await update_vehicle(vehicle_id, body)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Vehicle not found"},
        )
    return vehicle


@router.delete(
    "/vehicles/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
    response_class=Response,
)
async def delete_vehicle_route(vehicle_id: str) -> Response:
    ok = await delete_vehicle(vehicle_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Vehicle not found"},
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/vehicles/{vehicle_id}/images",
    response_model=Vehicle,
    dependencies=[Depends(require_admin)],
)
async def upload_vehicle_images(
    vehicle_id: str,
    files: list[UploadFile] | None = File(None),
) -> Vehicle:
    uploaded = files or []
    if not uploaded:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "No files uploaded"},
        )
    if len(uploaded) > MAX_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": f"Maximum {MAX_FILES} files allowed"},
        )

    urls: list[str] = []
    try:
        for file in uploaded:
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"message": "File exceeds 8MB limit"},
                )
            url = await asyncio.to_thread(
                upload_bytes,
                content,
                original_filename=file.filename,
                content_type=file.content_type,
                prefix=f"vehicles/{vehicle_id}",
            )
            urls.append(url)
    except S3UploadError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"message": f"S3 upload failed: {exc}"},
        ) from exc

    vehicle = await append_images(vehicle_id, urls)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Vehicle not found"},
        )
    return vehicle


MAX_VIDEO_SIZE = 100 * 1024 * 1024


@router.post(
    "/vehicles/{vehicle_id}/video",
    response_model=Vehicle,
    dependencies=[Depends(require_admin)],
)
async def upload_vehicle_video(
    vehicle_id: str,
    file: UploadFile | None = File(None),
) -> Vehicle:
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "No video file uploaded"},
        )
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "No video file uploaded"},
        )
    if len(content) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Video exceeds 100MB limit"},
        )
    try:
        url = await asyncio.to_thread(
            upload_bytes,
            content,
            original_filename=file.filename or "video.mp4",
            content_type=file.content_type or "video/mp4",
            prefix=f"vehicles/{vehicle_id}/videos",
        )
    except S3UploadError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"message": f"S3 upload failed: {exc}"},
        ) from exc

    vehicle = await update_vehicle(vehicle_id, VehiclePatch(videoUrl=url))
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Vehicle not found"},
        )
    return vehicle
