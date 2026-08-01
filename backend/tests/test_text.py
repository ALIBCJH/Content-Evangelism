from app.text import estimate_read_minutes, slugify


def test_slugify_matches_frontend_behavior():
    assert slugify("The Cross of Jesus: Where Repentance Meets Mercy") == (
        "the-cross-of-jesus-where-repentance-meets-mercy"
    )
    assert slugify("God’s Silence — and Ours") == "gods-silence-and-ours"
    assert slugify("   ") == ""
    assert len(slugify("x" * 200)) <= 80


def test_estimate_read_minutes():
    assert estimate_read_minutes("word") == 1
    assert estimate_read_minutes(" ".join(["word"] * 400)) == 2


def test_database_url_normalization():
    from app.config import normalize_database_url

    # "user:password" verbatim — secret scanners ban-list these values
    url = "postgresql://user:password@ep-x.neon.tech/db?sslmode=require&channel_binding=require"
    normalized = normalize_database_url(url)
    assert normalized.startswith("postgresql+asyncpg://")
    assert "ssl=require" in normalized
    assert "sslmode" not in normalized
    assert "channel_binding" not in normalized
