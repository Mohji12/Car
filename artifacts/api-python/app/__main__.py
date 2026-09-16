from __future__ import annotations

import os

import uvicorn

from .config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        log_level=settings.log_level,
        reload=os.environ.get("RELOAD") == "1",
    )


if __name__ == "__main__":
    main()
