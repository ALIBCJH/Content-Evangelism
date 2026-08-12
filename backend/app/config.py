"""Settings, loaded from the environment (and backend/.env in development)."""
from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


_LOCAL_HOSTS = (None, "localhost", "127.0.0.1", "::1")


def normalize_database_url(url: str) -> str:
    """Make any Postgres URL (Neon's and Heroku's included) usable by SQLAlchemy+asyncpg.

    - postgres:// and postgresql:// become postgresql+asyncpg://
    - sslmode=require (libpq dialect) becomes ssl=require (asyncpg dialect)
    - channel_binding is dropped — asyncpg does not accept it
    - remote URLs with no ssl/sslmode param get ssl=require — Heroku
      Postgres omits the param from DATABASE_URL yet refuses plain TCP
    """
    parts = urlsplit(url)
    scheme = parts.scheme
    if scheme in ("postgres", "postgresql"):
        scheme = "postgresql+asyncpg"
    params = []
    has_ssl = False
    for key, value in parse_qsl(parts.query):
        if key == "sslmode":
            params.append(("ssl", value))
            has_ssl = True
        elif key == "ssl":
            params.append((key, value))
            has_ssl = True
        elif key == "channel_binding":
            continue
        else:
            params.append((key, value))
    if not has_ssl and parts.hostname not in _LOCAL_HOSTS:
        params.append(("ssl", "require"))
    return urlunsplit((scheme, parts.netloc, parts.path, urlencode(params), parts.fragment))


def pool_plan(
    pool_size: int, max_overflow: int, limit: int, workers: int
) -> tuple[int, int]:
    """Split a database's total connection budget across worker processes.

    Each uvicorn worker is its own process with its own pool, and on Heroku
    the worker count comes from the dyno size rather than from us — so the
    configured pool is a ceiling, trimmed to the share a worker may spend.
    A worker always keeps at least one connection: with absurd worker counts
    that is the floor, and the dyno needs shrinking instead.
    """
    workers = max(1, workers)
    share = max(1, limit // workers)
    size = max(1, min(pool_size, share))
    overflow = max(0, min(max_overflow, share - size))
    return size, overflow


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    admin_token: str = "change-me"
    cors_origins: str = "http://localhost:3000"

    # Set by the platform, not by us: Heroku exports DYNO ("web.1") on every
    # dyno and derives WEB_CONCURRENCY from the dyno's memory. uvicorn reads
    # WEB_CONCURRENCY by itself, so the worker count is only ours to size
    # the connection pool against. Both stay unset off-Heroku.
    dyno: str = ""
    web_concurrency: int = 1

    # Connections the database plan allows in total — Heroku Postgres
    # Essential-0 caps at 20. pool_plan divides it across the workers.
    db_pool_size: int = 5
    db_max_overflow: int = 5
    db_connection_limit: int = 20

    # Left unset, schema creation follows the host: on boot in development,
    # in the release phase on Heroku (see scripts/release.py).
    create_tables_on_boot: bool | None = None

    @property
    def on_heroku(self) -> bool:
        return bool(self.dyno)

    @property
    def tables_on_boot(self) -> bool:
        if self.create_tables_on_boot is not None:
            return self.create_tables_on_boot
        return not self.on_heroku

    @property
    def sqlalchemy_url(self) -> str:
        return normalize_database_url(self.database_url)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def _get_settings() -> Settings:
    return Settings()


def __getattr__(name: str):
    # Lazy `settings` (PEP 562): importing this module never requires env
    # vars — only touching `settings` does. Keeps unit tests env-free.
    if name == "settings":
        return _get_settings()
    raise AttributeError(name)
