from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SpecItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    label: str
    value: str


class Vehicle(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    make: str
    model: str
    variant: str
    year: int
    price: int
    mileage: int
    fuel: str
    transmission: str
    bodyType: str
    colour: str
    location: str
    status: Literal["available", "sold"]
    tags: list[str]
    featured: bool
    description: str
    highlights: list[str]
    specs: list[SpecItem]
    images: list[str]
    condition: str
    doors: int | None = None
    engineSize: str | None = None
    registrationDate: str | None = None
    registrationPlate: str | None = None
    videoUrl: str | None = None
    viewCount: int
    addedAt: str
    updatedAt: str


class VehicleInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str | None = None
    make: str
    model: str
    variant: str | None = None
    year: int
    price: int
    mileage: int
    fuel: str
    transmission: str
    bodyType: str
    colour: str
    location: str | None = None
    status: Literal["available", "sold"] | None = None
    tags: list[str] | None = None
    featured: bool | None = None
    description: str | None = None
    highlights: list[str] | None = None
    specs: list[SpecItem] | None = None
    images: list[str] | None = None
    condition: str | None = None
    doors: int | None = None
    engineSize: str | None = None
    registrationDate: str | None = None
    registrationPlate: str | None = None
    videoUrl: str | None = None


class VehiclePatch(BaseModel):
    model_config = ConfigDict(extra="ignore")

    make: str | None = None
    model: str | None = None
    variant: str | None = None
    year: int | None = None
    price: int | None = None
    mileage: int | None = None
    fuel: str | None = None
    transmission: str | None = None
    bodyType: str | None = None
    colour: str | None = None
    location: str | None = None
    status: Literal["available", "sold"] | None = None
    tags: list[str] | None = None
    featured: bool | None = None
    description: str | None = None
    highlights: list[str] | None = None
    specs: list[SpecItem] | None = None
    images: list[str] | None = None
    condition: str | None = None
    doors: int | None = None
    engineSize: str | None = None
    registrationDate: str | None = None
    registrationPlate: str | None = None
    videoUrl: str | None = None


class HealthStatus(BaseModel):
    status: str


class AnalyticsSummary(BaseModel):
    total: int
    available: int
    sold: int
    newArrival: int
    featured: int
    totalViews: int
    topViewed: list[Vehicle]
    recent: list[Vehicle]


class Message(BaseModel):
    message: str = Field(..., description="Error message")
