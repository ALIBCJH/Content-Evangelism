"""Async engine + session factory.

pool_pre_ping and a short pool_recycle matter with Neon: the compute
scales to zero when idle and silently drops connections — without them
the first request after a quiet spell would 500.
"""
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(
    settings.sqlalchemy_url,
    pool_size=5,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
