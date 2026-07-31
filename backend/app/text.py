"""Text helpers — ports of the frontend's slugify/estimateReadMinutes so
articles created through either stack come out identical."""
import re


def slugify(title: str) -> str:
    slug = title.lower()
    slug = re.sub(r"['’]", "", slug)
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug[:80]


def estimate_read_minutes(body: str) -> int:
    words = len(body.split())
    return max(1, round(words / 200))
