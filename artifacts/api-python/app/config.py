from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote_plus

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
UPLOADS_DIR = ROOT_DIR / "uploads"
DATA_FILE = DATA_DIR / "vehicles.json"


@dataclass(frozen=True)
class Settings:
    port: int
    admin_token: str
    database_url: str | None
    log_level: str
    aws_access_key_id: str | None
    aws_secret_access_key: str | None
    s3_bucket: str | None
    aws_region: str
    s3_public_acl: bool


def _build_database_url() -> str | None:
    explicit = os.environ.get("DATABASE_URL")
    if explicit:
        url = explicit
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        if url.startswith("mysql://"):
            return url.replace("mysql://", "mysql+aiomysql://", 1)
        return url

    host = os.environ.get("DB_HOST")
    if not host:
        return None
    port = os.environ.get("DB_PORT", "3306")
    user = os.environ.get("DB_USER", "")
    password = os.environ.get("DB_PASSWORD", "")
    name = os.environ.get("DB_NAME", "")
    return (
        f"mysql+aiomysql://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{name}?charset=utf8mb4"
    )


def get_settings() -> Settings:
    raw_port = os.environ.get("PORT")
    if not raw_port:
        raise RuntimeError("PORT environment variable is required but was not provided.")
    try:
        port = int(raw_port)
    except ValueError as exc:
        raise RuntimeError(f'Invalid PORT value: "{raw_port}"') from exc
    if port <= 0:
        raise RuntimeError(f'Invalid PORT value: "{raw_port}"')

    return Settings(
        port=port,
        admin_token=os.environ.get("ADMIN_TOKEN") or "carwebs-admin",
        database_url=_build_database_url(),
        log_level=os.environ.get("LOG_LEVEL", "info"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID") or None,
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY") or None,
        s3_bucket=os.environ.get("S3_BUCKET") or None,
        aws_region=os.environ.get("AWS_REGION") or "us-east-1",
        s3_public_acl=os.environ.get("S3_PUBLIC_ACL", "false").lower() in {"1", "true", "yes"},
    )
