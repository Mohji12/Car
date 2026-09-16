from __future__ import annotations

import json
import re
import time
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError

from .config import DATA_DIR, DATA_FILE
from .db import detect_store, session_scope
from .models import AnalyticsSummary, SpecItem, Vehicle, VehicleInput, VehiclePatch
from .schema_sql import VehicleRow
from .seed_data import SEED_VEHICLES


class StoreConflictError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.status = 409


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _to_iso(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    return str(value)


def make_id(make: str, model: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", f"{make}-{model}".lower()).strip("-")[:24]
    suffix = format(int(time.time() * 1000), "x")[-4:]
    return f"cw-{slug}-{suffix}"


def _as_list(value: Any) -> list:
    if value is None:
        return []
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return []
    if isinstance(value, list):
        return value
    return []


def to_vehicle(row: Any) -> Vehicle:
    if isinstance(row, Vehicle):
        return row
    if isinstance(row, VehicleRow):
        data = {
            "id": row.id,
            "make": row.make,
            "model": row.model,
            "variant": row.variant,
            "year": row.year,
            "price": row.price,
            "mileage": row.mileage,
            "fuel": row.fuel,
            "transmission": row.transmission,
            "bodyType": row.body_type,
            "colour": row.colour,
            "location": row.location,
            "status": "sold" if row.status == "sold" else "available",
            "tags": _as_list(row.tags),
            "featured": bool(row.featured),
            "description": row.description,
            "highlights": _as_list(row.highlights),
            "specs": _as_list(row.specs),
            "images": _as_list(row.images),
            "condition": row.condition or "Used",
            "doors": row.doors,
            "engineSize": row.engine_size,
            "registrationDate": row.registration_date,
            "registrationPlate": row.registration_plate,
            "videoUrl": row.video_url,
            "viewCount": row.view_count or 0,
            "addedAt": _to_iso(row.added_at),
            "updatedAt": _to_iso(row.updated_at),
        }
        return Vehicle.model_validate(data)

    data = dict(row)
    data["status"] = "sold" if data.get("status") == "sold" else "available"
    data["tags"] = _as_list(data.get("tags"))
    data["featured"] = bool(data.get("featured"))
    data["highlights"] = _as_list(data.get("highlights"))
    data["specs"] = _as_list(data.get("specs"))
    data["images"] = _as_list(data.get("images"))
    data["condition"] = data.get("condition") or "Used"
    data["viewCount"] = data.get("viewCount") or 0
    data["addedAt"] = _to_iso(data.get("addedAt"))
    data["updatedAt"] = _to_iso(data.get("updatedAt"))
    return Vehicle.model_validate(data)


async def _read_file_store() -> list[Vehicle]:
    try:
        raw = DATA_FILE.read_text(encoding="utf-8")
        items = json.loads(raw)
        return [to_vehicle(item) for item in items]
    except (FileNotFoundError, json.JSONDecodeError):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        seeded = [to_vehicle(item) for item in SEED_VEHICLES]
        await _write_file_store(seeded)
        return seeded


async def _write_file_store(vehicles: list[Vehicle]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = [v.model_dump(mode="json") for v in vehicles]
    DATA_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")


async def list_vehicles(
    *,
    status: str | None = None,
    tag: str | None = None,
    make: str | None = None,
) -> list[Vehicle]:
    store = await detect_store()
    if store == "file":
        vehicles = await _read_file_store()
        if status:
            vehicles = [v for v in vehicles if v.status == status]
        if tag:
            vehicles = [v for v in vehicles if tag in v.tags]
        if make:
            make_l = make.lower()
            vehicles = [v for v in vehicles if v.make.lower() == make_l]
        return sorted(vehicles, key=lambda v: v.addedAt, reverse=True)

    async with session_scope() as session:
        stmt = select(VehicleRow).order_by(VehicleRow.added_at.desc())
        if status:
            stmt = stmt.where(VehicleRow.status == status)
        if make:
            stmt = stmt.where(func.lower(VehicleRow.make) == make.lower())
        rows = (await session.execute(stmt)).scalars().all()
        result = [to_vehicle(row) for row in rows]
        if tag:
            result = [v for v in result if tag in v.tags]
        return result


async def get_vehicle(vehicle_id: str, increment_view: bool = False) -> Vehicle | None:
    store = await detect_store()
    if store != "sql":
        vehicles = await _read_file_store()
        index = next((i for i, v in enumerate(vehicles) if v.id == vehicle_id), -1)
        if index < 0:
            return None
        if increment_view:
            current = vehicles[index]
            vehicles[index] = current.model_copy(
                update={
                    "viewCount": current.viewCount + 1,
                    "updatedAt": _now_iso(),
                }
            )
            await _write_file_store(vehicles)
        return vehicles[index]

    async with session_scope() as session:
        if increment_view:
            await session.execute(
                update(VehicleRow)
                .where(VehicleRow.id == vehicle_id)
                .values(
                    view_count=VehicleRow.view_count + 1,
                    updated_at=datetime.now(timezone.utc),
                )
            )
            await session.commit()
        row = (
            await session.execute(select(VehicleRow).where(VehicleRow.id == vehicle_id))
        ).scalar_one_or_none()
        return to_vehicle(row) if row else None


def _build_record(input_data: VehicleInput) -> Vehicle:
    now = _now_iso()
    vehicle_id = (input_data.id or "").strip() or make_id(input_data.make, input_data.model)
    return Vehicle(
        id=vehicle_id,
        make=input_data.make,
        model=input_data.model,
        variant=input_data.variant or "",
        year=input_data.year,
        price=input_data.price,
        mileage=input_data.mileage,
        fuel=input_data.fuel,
        transmission=input_data.transmission,
        bodyType=input_data.bodyType,
        colour=input_data.colour,
        location=input_data.location or "St Albans",
        status=input_data.status or "available",
        tags=input_data.tags or [],
        featured=bool(input_data.featured) if input_data.featured is not None else False,
        description=input_data.description or "",
        highlights=input_data.highlights or [],
        specs=input_data.specs or [],
        images=input_data.images or [],
        condition=input_data.condition or "Used",
        doors=input_data.doors,
        engineSize=input_data.engineSize,
        registrationDate=input_data.registrationDate,
        registrationPlate=input_data.registrationPlate,
        videoUrl=input_data.videoUrl,
        viewCount=0,
        addedAt=now,
        updatedAt=now,
    )


async def create_vehicle(input_data: VehicleInput) -> Vehicle:
    record = _build_record(input_data)
    store = await detect_store()
    if store != "sql":
        vehicles = await _read_file_store()
        if any(v.id == record.id for v in vehicles):
            raise StoreConflictError("Vehicle id already exists")
        vehicles.insert(0, record)
        await _write_file_store(vehicles)
        return record

    now = datetime.now(timezone.utc)
    row = VehicleRow(
        id=record.id,
        make=record.make,
        model=record.model,
        variant=record.variant,
        year=record.year,
        price=record.price,
        mileage=record.mileage,
        fuel=record.fuel,
        transmission=record.transmission,
        body_type=record.bodyType,
        colour=record.colour,
        location=record.location,
        status=record.status,
        tags=record.tags,
        featured=record.featured,
        description=record.description,
        highlights=record.highlights,
        specs=[s.model_dump() if isinstance(s, SpecItem) else s for s in record.specs],
        images=record.images,
        condition=record.condition,
        doors=record.doors,
        engine_size=record.engineSize,
        registration_date=record.registrationDate,
        registration_plate=record.registrationPlate,
        video_url=record.videoUrl,
        view_count=0,
        added_at=now,
        updated_at=now,
    )
    async with session_scope() as session:
        session.add(row)
        try:
            await session.commit()
        except IntegrityError as exc:
            await session.rollback()
            raise StoreConflictError("Vehicle id already exists") from exc
        await session.refresh(row)
        return to_vehicle(row)


async def update_vehicle(vehicle_id: str, patch: VehiclePatch) -> Vehicle | None:
    store = await detect_store()
    patch_data = patch.model_dump(exclude_unset=True)
    if store != "sql":
        vehicles = await _read_file_store()
        index = next((i for i, v in enumerate(vehicles) if v.id == vehicle_id), -1)
        if index < 0:
            return None
        current = vehicles[index]
        merged = current.model_dump()
        merged.update(patch_data)
        merged["id"] = vehicle_id
        if "tags" not in patch_data:
            merged["tags"] = current.tags
        if "highlights" not in patch_data:
            merged["highlights"] = current.highlights
        if "specs" not in patch_data:
            merged["specs"] = current.specs
        if "images" not in patch_data:
            merged["images"] = current.images
        merged["updatedAt"] = _now_iso()
        vehicles[index] = Vehicle.model_validate(merged)
        await _write_file_store(vehicles)
        return vehicles[index]

    values: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    field_map = {
        "make": "make",
        "model": "model",
        "variant": "variant",
        "year": "year",
        "price": "price",
        "mileage": "mileage",
        "fuel": "fuel",
        "transmission": "transmission",
        "bodyType": "body_type",
        "colour": "colour",
        "location": "location",
        "status": "status",
        "tags": "tags",
        "featured": "featured",
        "description": "description",
        "highlights": "highlights",
        "specs": "specs",
        "images": "images",
        "condition": "condition",
        "doors": "doors",
        "engineSize": "engine_size",
        "registrationDate": "registration_date",
        "registrationPlate": "registration_plate",
        "videoUrl": "video_url",
    }
    for key, column in field_map.items():
        if key in patch_data:
            value = patch_data[key]
            if key == "specs" and value is not None:
                value = [
                    s.model_dump() if isinstance(s, SpecItem) else s for s in value
                ]
            values[column] = value

    async with session_scope() as session:
        result = await session.execute(
            update(VehicleRow).where(VehicleRow.id == vehicle_id).values(**values)
        )
        if result.rowcount == 0:
            await session.rollback()
            return None
        await session.commit()
        row = (
            await session.execute(select(VehicleRow).where(VehicleRow.id == vehicle_id))
        ).scalar_one_or_none()
        return to_vehicle(row) if row else None


async def delete_vehicle(vehicle_id: str) -> bool:
    store = await detect_store()
    if store != "sql":
        vehicles = await _read_file_store()
        next_list = [v for v in vehicles if v.id != vehicle_id]
        if len(next_list) == len(vehicles):
            return False
        await _write_file_store(next_list)
        return True

    async with session_scope() as session:
        row = (
            await session.execute(select(VehicleRow).where(VehicleRow.id == vehicle_id))
        ).scalar_one_or_none()
        if row is None:
            return False
        await session.delete(row)
        await session.commit()
        return True


async def append_images(vehicle_id: str, urls: list[str]) -> Vehicle | None:
    vehicle = await get_vehicle(vehicle_id, increment_view=False)
    if vehicle is None:
        return None
    return await update_vehicle(
        vehicle_id, VehiclePatch(images=[*vehicle.images, *urls])
    )


async def get_analytics_summary() -> AnalyticsSummary:
    vehicles = await list_vehicles()
    available = sum(1 for v in vehicles if v.status == "available")
    sold = sum(1 for v in vehicles if v.status == "sold")
    new_arrival = sum(1 for v in vehicles if "new_arrival" in v.tags)
    featured = sum(1 for v in vehicles if v.featured or "featured" in v.tags)
    total_views = sum(v.viewCount for v in vehicles)
    top_viewed = sorted(vehicles, key=lambda v: v.viewCount, reverse=True)[:5]
    recent = vehicles[:5]
    return AnalyticsSummary(
        total=len(vehicles),
        available=available,
        sold=sold,
        newArrival=new_arrival,
        featured=featured,
        totalViews=total_views,
        topViewed=top_viewed,
        recent=recent,
    )
