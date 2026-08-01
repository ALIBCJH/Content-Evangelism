"""normalize_database_url: every provider's URL shape must land on asyncpg."""
from app.config import normalize_database_url


def test_heroku_url_gets_driver_and_ssl():
    # Heroku Postgres: postgres:// scheme, no query params, SSL still mandatory.
    url = "postgres://user:password@ec2-1-2-3-4.compute-1.amazonaws.com:5432/dbname"
    assert normalize_database_url(url) == (
        "postgresql+asyncpg://user:password@ec2-1-2-3-4.compute-1.amazonaws.com:5432/dbname"
        "?ssl=require"
    )


def test_neon_url_maps_sslmode_and_drops_channel_binding():
    url = (
        "postgresql://user:password@ep-x.eu-central-1.aws.neon.tech/neondb"
        "?sslmode=require&channel_binding=require"
    )
    assert normalize_database_url(url) == (
        "postgresql+asyncpg://user:password@ep-x.eu-central-1.aws.neon.tech/neondb"
        "?ssl=require"
    )


def test_local_url_stays_plaintext():
    url = "postgresql://user:password@localhost:5455/appdb"
    assert normalize_database_url(url) == (
        "postgresql+asyncpg://user:password@localhost:5455/appdb"
    )


def test_explicit_ssl_param_is_kept_not_duplicated():
    url = "postgresql://user:password@db.example.com/app?ssl=verify-full"
    out = normalize_database_url(url)
    assert out.count("ssl=") == 1
    assert out.endswith("?ssl=verify-full")
