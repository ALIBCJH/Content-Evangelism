"""Schema step for Heroku's release phase.

Heroku runs this once per deploy, after the build and before any new dyno
takes traffic:

    release: python -m scripts.release

Keeping DDL here rather than in the web dyno's lifespan means one process
creates the schema instead of every uvicorn worker racing to — concurrent
create_all on the same GIN index is how that race shows up. A non-zero exit
aborts the release, so a schema that cannot be applied never goes live.

Idempotent: create_all skips what already exists, so re-running is free.
"""
import asyncio

from app.db import Base, engine

# Imported for the side effect: a model only registers itself on Base.metadata
# when its module is imported, and create_all builds nothing it has not been
# told about. main.py gets this transitively through the routers; here it has
# to be explicit, or the release phase would report success on an empty schema.
from app import models  # noqa: F401


async def run() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("release: schema up to date")


if __name__ == "__main__":
    asyncio.run(run())
