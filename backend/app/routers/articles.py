from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin
from app.db import get_session
from app.models import CATEGORIES, Article
from app.schemas import (
    ArticleCreate,
    ArticleListOut,
    ArticleOut,
    ArticleUpdate,
    CategoryCount,
    SearchHit,
)
from app.text import estimate_read_minutes, slugify

router = APIRouter(prefix="/api")

# Slugs owned by static pages in the frontend — never assign them here.
RESERVED_SLUGS: set[str] = set()


async def _unique_slug(session: AsyncSession, wanted: str) -> str:
    """wanted, wanted-2, wanted-3, … until free."""
    slug, n = wanted, 1
    while True:
        exists = await session.scalar(select(Article.id).where(Article.slug == slug))
        if exists is None and slug not in RESERVED_SLUGS:
            return slug
        n += 1
        slug = f"{wanted[:70]}-{n}"


@router.get("/articles", response_model=ArticleListOut)
async def list_articles(
    category: str | None = None,
    q: str | None = Query(default=None, max_length=200),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Article)
    if category:
        if category not in CATEGORIES:
            raise HTTPException(404, f"Unknown category {category!r}")
        stmt = stmt.where(Article.category == category)
    if q:
        tsq = func.websearch_to_tsquery("english", q)
        stmt = stmt.where(Article.search_vector.op("@@")(tsq)).order_by(
            func.ts_rank(Article.search_vector, tsq).desc()
        )
    else:
        stmt = stmt.order_by(Article.published_at.desc())

    total = await session.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = (await session.scalars(stmt.limit(limit).offset(offset))).all()
    return ArticleListOut(total=total or 0, items=[ArticleOut.model_validate(r) for r in rows])


@router.get("/articles/{slug}", response_model=ArticleOut)
async def get_article(slug: str, session: AsyncSession = Depends(get_session)):
    article = await session.scalar(select(Article).where(Article.slug == slug))
    if article is None:
        raise HTTPException(404, "Article not found")
    return article


@router.post(
    "/articles",
    response_model=ArticleOut,
    status_code=201,
    dependencies=[Depends(require_admin)],
)
async def create_article(payload: ArticleCreate, session: AsyncSession = Depends(get_session)):
    wanted = slugify(payload.slug or payload.title)
    if not wanted:
        raise HTTPException(422, "Title produces an empty slug")
    article = Article(
        slug=await _unique_slug(session, wanted),
        title=payload.title,
        dek=payload.dek,
        category=payload.category,
        author_name=payload.author_name,
        body=payload.body,
        image_url=payload.image_url,
        read_minutes=estimate_read_minutes(payload.body),
    )
    if payload.published_at is not None:
        article.published_at = payload.published_at
    session.add(article)
    await session.commit()
    await session.refresh(article)
    return article


@router.patch(
    "/articles/{slug}",
    response_model=ArticleOut,
    dependencies=[Depends(require_admin)],
)
async def update_article(
    slug: str, payload: ArticleUpdate, session: AsyncSession = Depends(get_session)
):
    article = await session.scalar(select(Article).where(Article.slug == slug))
    if article is None:
        raise HTTPException(404, "Article not found")
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(article, field, value)
    if "body" in changes:
        article.read_minutes = estimate_read_minutes(article.body)
    await session.commit()
    await session.refresh(article)
    return article


@router.delete(
    "/articles/{slug}", status_code=204, dependencies=[Depends(require_admin)]
)
async def delete_article(slug: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(delete(Article).where(Article.slug == slug))
    await session.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Article not found")
    return Response(status_code=204)


@router.get("/search", response_model=list[SearchHit])
async def search(
    q: str = Query(min_length=1, max_length=200),
    limit: int = Query(default=20, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
):
    """Ranked full-text search with a highlighted snippet per hit."""
    tsq = func.websearch_to_tsquery("english", q)
    snippet = func.ts_headline(
        "english",
        Article.body,
        tsq,
        text("'StartSel=<b>, StopSel=</b>, MaxWords=30, MinWords=15'"),
    ).label("snippet")
    stmt = (
        select(Article, snippet)
        .where(Article.search_vector.op("@@")(tsq))
        .order_by(func.ts_rank(Article.search_vector, tsq).desc())
        .limit(limit)
    )
    rows = (await session.execute(stmt)).all()
    return [
        SearchHit(
            slug=a.slug,
            title=a.title,
            dek=a.dek,
            category=a.category,
            author_name=a.author_name,
            image_url=a.image_url,
            published_at=a.published_at,
            read_minutes=a.read_minutes,
            snippet=s,
        )
        for a, s in rows
    ]


@router.get("/categories", response_model=list[CategoryCount])
async def categories(session: AsyncSession = Depends(get_session)):
    rows = (
        await session.execute(
            select(Article.category, func.count()).group_by(Article.category)
        )
    ).all()
    counts = dict(rows)
    return [CategoryCount(category=c, count=counts.get(c, 0)) for c in CATEGORIES]
