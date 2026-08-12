"""Heroku hosting rules: pool sizing and who owns DDL.

No database needed — these are decisions made from the environment alone.
Settings are built with explicit kwargs so a developer's own exported
DYNO/WEB_CONCURRENCY cannot sway the result.
"""
from app.config import Settings, pool_plan

LOCAL_DB = "postgresql://user:password@localhost:5455/appdb"


def test_single_worker_keeps_the_configured_pool():
    # The local case: one process, nothing to divide.
    assert pool_plan(5, 5, 20, 1) == (5, 5)


def test_workers_share_the_connection_limit():
    # A Standard dyno's WEB_CONCURRENCY must not multiply the pool past
    # what Essential-0 allows in total.
    for workers in (2, 4, 8, 16):
        size, overflow = pool_plan(5, 5, 20, workers)
        assert (size + overflow) * workers <= 20, workers
        assert size >= 1, workers


def test_a_bigger_plan_restores_the_full_pool():
    assert pool_plan(5, 5, 80, 4) == (5, 5)


def test_release_phase_owns_ddl_on_heroku():
    heroku = Settings(database_url=LOCAL_DB, dyno="web.1")
    assert heroku.on_heroku
    assert not heroku.tables_on_boot


def test_boot_creates_tables_off_heroku():
    local = Settings(database_url=LOCAL_DB, dyno="")
    assert not local.on_heroku
    assert local.tables_on_boot


def test_boot_ddl_can_be_forced_back_on():
    forced = Settings(database_url=LOCAL_DB, dyno="web.1", create_tables_on_boot=True)
    assert forced.tables_on_boot


def test_release_phase_sees_the_article_table(monkeypatch):
    # create_all only builds tables whose module has been imported. Without
    # that import the release phase would exit 0 on an empty schema and the
    # deploy would look healthy until the first query.
    monkeypatch.setenv("DATABASE_URL", LOCAL_DB)
    import scripts.release  # noqa: F401
    from app.db import Base

    assert "articles" in Base.metadata.tables
