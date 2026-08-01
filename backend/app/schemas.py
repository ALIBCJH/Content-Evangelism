"""API shapes. Field names are camelCase on the wire — identical to the
PostedArticle interface the Next.js frontend already uses — and
snake_case in Python/Postgres."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel

from app.models import CATEGORIES


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ArticleCreate(CamelModel):
    title: str = Field(min_length=3, max_length=300)
    dek: str = Field(min_length=1)
    category: str
    author_name: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1)
    image_url: str | None = None
    slug: str | None = Field(default=None, max_length=120)
    published_at: datetime | None = None

    @field_validator("category")
    @classmethod
    def category_must_be_known(cls, v: str) -> str:
        if v not in CATEGORIES:
            raise ValueError(f"unknown category {v!r}; expected one of {CATEGORIES}")
        return v


class ArticleUpdate(CamelModel):
    title: str | None = Field(default=None, min_length=3, max_length=300)
    dek: str | None = None
    category: str | None = None
    author_name: str | None = None
    body: str | None = None
    image_url: str | None = None
    published_at: datetime | None = None

    @field_validator("category")
    @classmethod
    def category_must_be_known(cls, v: str | None) -> str | None:
        if v is not None and v not in CATEGORIES:
            raise ValueError(f"unknown category {v!r}; expected one of {CATEGORIES}")
        return v


class ArticleOut(CamelModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )

    slug: str
    title: str
    dek: str
    category: str
    author_name: str
    body: str
    image_url: str | None
    published_at: datetime
    # Feeds sitemap <lastmod> and Article dateModified downstream.
    updated_at: datetime
    read_minutes: int


class ArticleListOut(CamelModel):
    total: int
    items: list[ArticleOut]


class SearchHit(CamelModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )

    slug: str
    title: str
    dek: str
    category: str
    author_name: str
    image_url: str | None
    published_at: datetime
    read_minutes: int
    # <b>…</b>-highlighted snippet around the match, built by ts_headline.
    snippet: str


class CategoryCount(CamelModel):
    category: str
    count: int
