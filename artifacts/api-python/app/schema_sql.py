from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class VehicleRow(Base):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    make: Mapped[str] = mapped_column(String(128), nullable=False)
    model: Mapped[str] = mapped_column(String(128), nullable=False)
    variant: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    mileage: Mapped[int] = mapped_column(Integer, nullable=False)
    fuel: Mapped[str] = mapped_column(String(64), nullable=False)
    transmission: Mapped[str] = mapped_column(String(64), nullable=False)
    body_type: Mapped[str] = mapped_column("body_type", String(64), nullable=False)
    colour: Mapped[str] = mapped_column(String(128), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False, default="St Albans")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="available")
    tags: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    highlights: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    specs: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    images: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    condition: Mapped[str] = mapped_column("condition", String(64), nullable=False, default="Used")
    doors: Mapped[int | None] = mapped_column(Integer, nullable=True)
    engine_size: Mapped[str | None] = mapped_column("engine_size", String(64), nullable=True)
    registration_date: Mapped[str | None] = mapped_column(
        "registration_date", String(64), nullable=True
    )
    registration_plate: Mapped[str | None] = mapped_column(
        "registration_plate", String(64), nullable=True
    )
    video_url: Mapped[str | None] = mapped_column("video_url", Text, nullable=True)
    view_count: Mapped[int] = mapped_column("view_count", Integer, nullable=False, default=0)
    added_at: Mapped[datetime] = mapped_column(
        "added_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updated_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )
