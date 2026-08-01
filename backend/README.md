# Publication API — FastAPI + Neon Postgres

The standalone backend for Repent and Prepare the Way. Serves the same
article shapes the Next.js frontend already uses (camelCase, identical
field names), plus real Postgres full-text search.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | – | liveness + DB check |
| GET | `/api/articles?category=&q=&limit=&offset=` | – | list, newest first (ranked when `q` given) |
| GET | `/api/articles/{slug}` | – | one article |
| POST | `/api/articles` | Bearer | create (slug + readMinutes auto-generated) |
| PATCH | `/api/articles/{slug}` | Bearer | partial update |
| DELETE | `/api/articles/{slug}` | Bearer | delete |
| GET | `/api/search?q=` | – | ranked hits with `<b>`-highlighted snippets |
| GET | `/api/categories` | – | article count per category |

Interactive docs at `/docs` (Swagger) and `/redoc` once running.

## Local development (no Neon needed)

```bash
cd backend
docker compose up -d                 # Postgres 16 on localhost:5455, data persists
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8801
python -m scripts.seed               # import ../data/articles.json
```

The committed `.env.example` shows the shape; a local `.env` (gitignored)
pointing at the compose database looks like:

```
DATABASE_URL=postgresql://rptw@localhost:5455/rptw
ADMIN_TOKEN=any-value-you-like-for-local-dev
CORS_ORIGINS=http://localhost:3000
```

The compose database is passwordless (`trust` auth) and reachable from
this machine only — the port is bound to 127.0.0.1. A volume created
before the passwordless switch still expects its old password; run
`docker compose down -v && docker compose up -d` once to reinitialize
(then reseed), or keep your existing password in the local `.env`.

Port notes for this machine: 8000 is occupied by another project's Django
server and 5433 by another Postgres — hence 8801 and 5455.

## Going hosted with Neon

1. **Create the database** — [neon.tech](https://neon.tech) → New Project →
   copy the connection string from **Connect** (the `postgresql://…` one).
2. **Configure** — in `backend/`:
   ```bash
   cp .env.example .env    # paste DATABASE_URL, set a strong ADMIN_TOKEN
   ```
   Neon's `sslmode=require`/`channel_binding` params are handled automatically.
3. **Install & run**:
   ```bash
   cd backend
   python3 -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
   Tables are created on first boot.
4. **Seed from the existing JSON store** (optional):
   ```bash
   python -m scripts.seed            # imports ../data/articles.json
   ```

## Publishing an article

```bash
curl -X POST http://localhost:8000/api/articles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Fear of the LORD",
    "dek": "The beginning of wisdom, revisited.",
    "category": "Teachings",
    "authorName": "The Editorial Desk",
    "body": "Full text here. Blank line = paragraph, \"## \" = subheading.",
    "imageUrl": "/images/articles/example.jpg"
  }'
```

## Wiring the frontend to it

`src/lib/posted.ts` is the only frontend file that talks to storage.
Point its functions at this API (e.g. `API_URL=https://api.example.com`)
and nothing else in the site changes. Recommended order: deploy this API,
seed it, then switch `posted.ts` over in one small PR.

## Deploying to Heroku

The repo root is the Next.js site, so the backend deploys as its own
Heroku app from this subdirectory via `git subtree`. `Procfile` and
`.python-version` in `backend/` become the app root of the pushed tree.

One-time setup (from the **repo root**):

```bash
heroku login
heroku create rptw-api                        # pick your own app name

# Database — either attach Heroku Postgres…
heroku addons:create heroku-postgresql:essential-0 -a rptw-api
# …or keep Neon and set its connection string yourself:
# heroku config:set DATABASE_URL='postgresql://…neon.tech/neondb?sslmode=require' -a rptw-api

heroku config:set -a rptw-api \
  ADMIN_TOKEN="$(openssl rand -hex 32)" \
  CORS_ORIGINS="https://repentandpreparetheway.org,https://www.repentandpreparetheway.org"
```

Deploy (every time, from the repo root on `main`):

```bash
git subtree push --prefix backend heroku main
```

(First add the remote: `heroku git:remote -a rptw-api`. If Heroku rejects
a push after history was squashed, force it with
`git push heroku "$(git subtree split --prefix backend main)":main --force`.)

Verify, then point the frontend at it:

```bash
curl https://rptw-api.herokuapp.com/health    # {"status":"ok"}
# In the frontend host's env (NOT committed):
#   API_URL=https://rptw-api.herokuapp.com
#   ADMIN_TOKEN=<same value as the backend's>
```

Heroku specifics already handled by the code:

- `Procfile` binds uvicorn to Heroku's `$PORT`.
- `DATABASE_URL` arrives as `postgres://` with no `sslmode` param;
  `normalize_database_url` upgrades the scheme for asyncpg and defaults
  remote hosts to `ssl=require` (Heroku refuses plain TCP).
- Tables are created on boot, so no release phase is needed yet — add
  one (`release: alembic upgrade head`) when Alembic arrives.
- Seeding a fresh database: `DATABASE_URL="$(heroku config:get DATABASE_URL -a rptw-api)" python -m scripts.seed`.
- Dyno restarts happen daily; state lives only in Postgres, so this is safe.

Any other always-on Python host (Render, Railway, Fly.io) works the same
way: build `pip install -r requirements.txt`, start
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`, env `DATABASE_URL`,
`ADMIN_TOKEN`, `CORS_ORIGINS`.

If you stay on Neon: its free tier scales to zero when idle; the
connection pool here is configured (pre-ping + recycle) to survive that.

## Notes

- Schema changes: tables are auto-created but never migrated — introduce
  Alembic when the schema outgrows one table.
- Tests: `pytest` runs the unit tests in `tests/` (no database needed).
