"""Create vehicles table on the configured MySQL database."""
from __future__ import annotations

import os
from pathlib import Path

import pymysql
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

schema_path = Path(__file__).resolve().parents[3] / "lib" / "db" / "schema.mysql.sql"


def main() -> None:
    host = os.environ["DB_HOST"]
    port = int(os.environ.get("DB_PORT", "3306"))
    user = os.environ["DB_USER"]
    password = os.environ["DB_PASSWORD"]
    db = os.environ["DB_NAME"]

    schema = schema_path.read_text(encoding="utf-8")
    stmts: list[str] = []
    buf: list[str] = []
    for line in schema.splitlines():
        s = line.strip()
        if not s or s.startswith("--"):
            continue
        buf.append(line)
        if s.endswith(";"):
            stmts.append("\n".join(buf))
            buf = []

    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=db,
        connect_timeout=20,
        charset="utf8mb4",
    )
    try:
        with conn.cursor() as cur:
            for stmt in stmts:
                cur.execute(stmt)
            conn.commit()
            cur.execute("SHOW TABLES")
            print("Tables:", cur.fetchall())
    finally:
        conn.close()
    print(f"OK: vehicles table ready in MySQL database {db}")


if __name__ == "__main__":
    main()
