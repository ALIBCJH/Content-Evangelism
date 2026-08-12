"""Async engine + session factory.

pool_pre_ping and a short pool_recycle matter with Neon: the compute
scales to zero when idle and silently drops connections — without them
the first request after a quiet spell would 500. They earn their keep on
Heroku too, where a daily dyno restart and the database's own idle
timeout drop connections the pool still believes in.
"""
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import pool_plan, settings

# Sized per worker, because each uvicorn worker is a process with its own
# pool and Heroku picks the worker count from the dyno size. Left unsized,
# a bigger dyno would silently multiply the pool past what the database
# plan allows and hand out connection errors instead of pages.
_pool_size, _max_overflow = pool_plan(
    settings.db_pool_size,
    settings.db_max_overflow,
    settings.db_connection_limit,
    settings.web_concurrency,
)

engine = create_async_engine(
    settings.sqlalchemy_url,
    pool_size=_pool_size,
    max_overflow=_max_overflow,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
