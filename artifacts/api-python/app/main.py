from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import ROOT_DIR, UPLOADS_DIR

load_dotenv(ROOT_DIR / ".env")

from .config import get_settings  # noqa: E402
from .db import dispose_engine  # noqa: E402
from .routers import analytics, health, vehicles  # noqa: E402


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    yield
    await dispose_engine()


def create_app() -> FastAPI:
    get_settings()
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    application = FastAPI(title="CarWebs Motors API", version="0.1.0", lifespan=lifespan)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.exception_handler(HTTPException)
    async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
        if isinstance(exc.detail, dict) and "message" in exc.detail:
            return JSONResponse(status_code=exc.status_code, content=exc.detail)
        if isinstance(exc.detail, str):
            return JSONResponse(
                status_code=exc.status_code, content={"message": exc.detail}
            )
        return JSONResponse(status_code=exc.status_code, content={"message": "Error"})

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={"message": "Validation error", "errors": exc.errors()},
        )

    api = APIRouter(prefix="/api")
    api.include_router(health.router)
    api.include_router(vehicles.router)
    api.include_router(analytics.router)
    application.include_router(api)
    application.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
    return application


app = create_app()
