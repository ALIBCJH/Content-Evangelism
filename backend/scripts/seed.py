"""Import articles from the Next.js JSON store into Postgres.

Usage (from backend/, venv active, DATABASE_URL set):
    python -m scripts.seed [path/to/articles.json]

Defaults to ../data/articles.json. Idempotent: existing slugs are updated,
new ones inserted.
"""
import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import select

from app.db import Base, SessionLocal, engine
from app.models import Article
from app.text import estimate_read_minutes

DEFAULT_PATH = Path(__file__).resolve().parents[2] / "data" / "articles.json"


def parse_when(value: str) -> datetime:
    # The JSON store keeps either full ISO timestamps or bare YYYY-MM-DD.
    return datetime.fromisoformat(value)


async def run(path: Path) -> None:
    raw = json.loads(path.read_text())
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with SessionLocal() as session:
        created = updated = 0
        for item in raw:
            fields = dict(
                title=item["title"],
                dek=item["dek"],
                category=item["category"],
                author_name=item["authorName"],
                body=item["body"],
                image_url=item.get("imageUrl"),
                published_at=parse_when(item["publishedAt"]),
                read_minutes=item.get("readMinutes") or estimate_read_minutes(item["body"]),
            )
            existing = await session.scalar(
                select(Article).where(Article.slug == item["slug"])
            )
            if existing:
                for k, v in fields.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                session.add(Article(slug=item["slug"], **fields))
                created += 1
        await session.commit()
    print(f"seeded {path.name}: {created} created, {updated} updated")


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PATH
    if not target.exists():
        sys.exit(f"no such file: {target}")
    asyncio.run(run(target))
