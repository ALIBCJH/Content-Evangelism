"""Settings, loaded from the environment (and backend/.env in development)."""
from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(url: str) -> str:
    """Make any Postgres URL (Neon's included) usable by SQLAlchemy+asyncpg.

    - postgres:// and postgresql:// become postgresql+asyncpg://
    - sslmode=require (libpq dialect) becomes ssl=require (asyncpg dialect)
    - channel_binding is dropped — asyncpg does not accept it
    """
    scheme, netloc, path, query, fragment = urlsplit(url)
    if scheme in ("postgres", "postgresql"):
        scheme = "postgresql+asyncpg"
    params = []
    for key, value in parse_qsl(query):
        if key == "sslmode":
            params.append(("ssl", value))
        elif key == "channel_binding":
            continue
        else:
            params.append((key, value))
    return urlunsplit((scheme, netloc, path, urlencode(params), fragment))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    admin_token: str = "change-me"
    cors_origins: str = "http://localhost:3000"

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
