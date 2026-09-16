# CarWebs Motors

A car dealership showroom web app for browsing inventory, saving vehicles, and managing stock from an admin portal.

## Run & Operate

### Environment

| Variable | Used by | Notes |
|----------|---------|-------|
| `PORT` | frontend + API | Frontend e.g. `5173`; API e.g. `5000` |
| `BASE_PATH` | frontend | Use `/` locally |
| `ADMIN_TOKEN` | API `/admin` | Default `carwebs-admin` if unset |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | API | MySQL connection (see `artifacts/api-python/.env`) |

### Commands

```powershell
# API — FastAPI (port 5000)
cd artifacts/api-python
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 5000

# Frontend (port 5173) — proxies /api and /uploads to :5000
cd ../..
$env:PORT="5173"
$env:BASE_PATH="/"
pnpm --filter @workspace/carwebs-motors run dev
```

- `pnpm run typecheck` — full typecheck
- `pnpm run build` — typecheck + build frontend packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client from OpenAPI

Admin: open `/admin` and sign in with `ADMIN_TOKEN`.

## Stack

- pnpm workspaces, TypeScript 5.9 (frontend)
- Frontend: React 19, Vite, Tailwind CSS, TanStack Query
- API: **Python FastAPI** (`artifacts/api-python`)
- DB: **MySQL** (with JSON file fallback if DB is unreachable)
