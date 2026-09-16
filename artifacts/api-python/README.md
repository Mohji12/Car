# CarWebs Motors — FastAPI backend

Drop-in FastAPI backend for CarWebs Motors. Same `/api` contract, Bearer `ADMIN_TOKEN`, and `/uploads`.

## Setup

```powershell
cd artifacts/api-python
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
```

Copy `.env` (gitignored) with DB settings:

```env
PORT=5000
ADMIN_TOKEN=carwebs-admin
DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=Car
```

## MySQL schema + seed

```powershell
python scripts\create_mysql_tables.py
python scripts\seed_mysql.py
```

Schema SQL: `lib/db/schema.mysql.sql`

## Run

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 5000
```

- Health: http://localhost:5000/api/healthz
- Docs: http://localhost:5000/docs

If `DB_*` / `DATABASE_URL` is unset or unreachable, the API falls back to `data/vehicles.json`.

## S3 image uploads

Set in `.env`:

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=caruk2026
AWS_REGION=us-east-1
```

Admin image uploads go to `s3://{bucket}/vehicles/{vehicleId}/...` and the public URL is stored in MySQL `images`.
