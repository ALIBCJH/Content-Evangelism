from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.db import Base, engine
from app.routers.articles import router as articles_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on boot in development — enough while the schema is one
    # table; switch to Alembic migrations when it grows. On Heroku the
    # release phase (scripts/release.py) owns this instead: a web dyno may
    # boot several uvicorn workers at once, and they would race on the DDL.
    if settings.tables_on_boot:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Repent and Prepare the Way — Publication API",
    description=(
        "Backend for the publication desk of the Ministry of Repentance "
        "and Holiness: articles, search, and categories."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(articles_router)


@app.get("/health")
async def health():
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return {"status": "ok"}
