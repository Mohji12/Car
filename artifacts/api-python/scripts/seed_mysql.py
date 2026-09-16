"""Seed MySQL vehicles table with sample inventory."""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path

import pymysql
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from app.seed_data import SEED_VEHICLES  # noqa: E402


def _parse_dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)


def main() -> None:
    conn = pymysql.connect(
        host=os.environ["DB_HOST"],
        port=int(os.environ.get("DB_PORT", "3306")),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.environ["DB_NAME"],
        charset="utf8mb4",
        connect_timeout=20,
    )
    sql = """
    INSERT INTO vehicles (
      id, make, model, variant, year, price, mileage, fuel, transmission,
      body_type, colour, location, status, tags, featured, description,
      highlights, specs, images, `condition`, doors, engine_size,
      registration_date, registration_plate, video_url, view_count, added_at, updated_at
    ) VALUES (
      %(id)s, %(make)s, %(model)s, %(variant)s, %(year)s, %(price)s, %(mileage)s,
      %(fuel)s, %(transmission)s, %(body_type)s, %(colour)s, %(location)s,
      %(status)s, %(tags)s, %(featured)s, %(description)s, %(highlights)s,
      %(specs)s, %(images)s, %(condition)s, %(doors)s, %(engine_size)s,
      %(registration_date)s, %(registration_plate)s, %(video_url)s, %(view_count)s,
      %(added_at)s, %(updated_at)s
    )
    ON DUPLICATE KEY UPDATE
      make=VALUES(make), model=VALUES(model), variant=VALUES(variant),
      year=VALUES(year), price=VALUES(price), mileage=VALUES(mileage),
      fuel=VALUES(fuel), transmission=VALUES(transmission), body_type=VALUES(body_type),
      colour=VALUES(colour), location=VALUES(location), status=VALUES(status),
      tags=VALUES(tags), featured=VALUES(featured), description=VALUES(description),
      highlights=VALUES(highlights), specs=VALUES(specs), images=VALUES(images),
      `condition`=VALUES(`condition`), doors=VALUES(doors), engine_size=VALUES(engine_size),
      registration_date=VALUES(registration_date),
      registration_plate=VALUES(registration_plate), video_url=VALUES(video_url),
      view_count=VALUES(view_count), updated_at=VALUES(updated_at)
    """
    try:
        with conn.cursor() as cur:
            for item in SEED_VEHICLES:
                params = {
                    "id": item["id"],
                    "make": item["make"],
                    "model": item["model"],
                    "variant": item["variant"],
                    "year": item["year"],
                    "price": item["price"],
                    "mileage": item["mileage"],
                    "fuel": item["fuel"],
                    "transmission": item["transmission"],
                    "body_type": item["bodyType"],
                    "colour": item["colour"],
                    "location": item["location"],
                    "status": item["status"],
                    "tags": json.dumps(item["tags"]),
                    "featured": 1 if item["featured"] else 0,
                    "description": item["description"],
                    "highlights": json.dumps(item["highlights"]),
                    "specs": json.dumps(item["specs"]),
                    "images": json.dumps(item["images"]),
                    "condition": item["condition"],
                    "doors": item["doors"],
                    "engine_size": item["engineSize"],
                    "registration_date": item["registrationDate"],
                    "registration_plate": item["registrationPlate"],
                    "video_url": item["videoUrl"],
                    "view_count": item["viewCount"],
                    "added_at": _parse_dt(item["addedAt"]),
                    "updated_at": _parse_dt(item["updatedAt"]),
                }
                cur.execute(sql, params)
            conn.commit()
            cur.execute("SELECT COUNT(*) FROM vehicles")
            print("vehicles count:", cur.fetchone()[0])
    finally:
        conn.close()
    print("Seed complete")


if __name__ == "__main__":
    main()
