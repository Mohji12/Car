from __future__ import annotations

import mimetypes
import uuid
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from .config import get_settings


class S3UploadError(Exception):
    pass


def _client():
    settings = get_settings()
    if not settings.aws_access_key_id or not settings.aws_secret_access_key:
        raise S3UploadError("AWS credentials are not configured")
    if not settings.s3_bucket:
        raise S3UploadError("S3 bucket is not configured")
    return boto3.client(
        "s3",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )


def public_object_url(key: str) -> str:
    settings = get_settings()
    bucket = settings.s3_bucket
    region = settings.aws_region
    if region == "us-east-1":
        return f"https://{bucket}.s3.amazonaws.com/{key}"
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"


def upload_bytes(
    content: bytes,
    *,
    original_filename: str | None = None,
    content_type: str | None = None,
    prefix: str = "vehicles",
) -> str:
    """Upload bytes to S3 and return the public object URL."""
    settings = get_settings()
    suffix = Path(original_filename or "").suffix.lower() or ".jpg"
    key = f"{prefix}/{uuid.uuid4()}{suffix}"
    guessed = content_type or mimetypes.guess_type(original_filename or "")[0] or "application/octet-stream"

    client = _client()
    extra_args: dict = {"ContentType": guessed}
    # Prefer bucket policy for public read; ACL may be blocked on newer buckets.
    if settings.s3_public_acl:
        extra_args["ACL"] = "public-read"

    try:
        client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=content,
            **extra_args,
        )
    except (BotoCoreError, ClientError) as exc:
        raise S3UploadError(str(exc)) from exc

    return public_object_url(key)
