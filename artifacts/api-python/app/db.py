from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from .config import get_settings
from .schema_sql import VehicleRow

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None
_use_sql: bool | None = None


def has_database_url() -> bool:
    return bool(get_settings().database_url)


def get_engine() -> AsyncEngine:
    global _engine, _session_factory
    settings = get_settings()
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL / DB_* is not set")
    if _engine is None:
        _engine = create_async_engine(settings.database_url, pool_pre_ping=True)
        _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    get_engine()
    assert _session_factory is not None
    return _session_factory


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    factory = get_session_factory()
    async with factory() as session:
        yield session


async def detect_store() -> str:
    """Return 'sql' when DB is reachable, otherwise 'file'."""
    global _use_sql
    if _use_sql is True:
        return "sql"
    if _use_sql is False:
        return "file"
    if not has_database_url():
        _use_sql = False
        return "file"
    try:
        get_engine()
        async with session_scope() as session:
            await session.execute(select(VehicleRow.id).limit(1))
        _use_sql = True
        return "sql"
    except Exception:
        _use_sql = False
        return "file"


async def dispose_engine() -> None:
    global _engine, _session_factory, _use_sql
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None
    _use_sql = None
