"""What an unset ADMIN_TOKEN means.

It meant "change-me", which is to say every write endpoint was open to
anybody who had read the example file. A missing secret must never be a
usable one: the failure of a deployment step should be a service nobody
can post to, which somebody notices, rather than a service anybody can
post to, which nobody does. The Next.js store has always taken this line
and said so; this is the same rule on the other side of the repository.
"""
import asyncio

import pytest
from fastapi import HTTPException

from app import auth


class _Settings:
    def __init__(self, admin_token: str) -> None:
        self.admin_token = admin_token


def _call(authorization: str, admin_token: str) -> None:
    auth.settings = _Settings(admin_token)
    try:
        asyncio.run(auth.require_admin(authorization))
    finally:
        del auth.settings


def test_no_token_configured_refuses_even_a_matching_header():
    """The empty string is not a password, and must not act as one."""
    with pytest.raises(HTTPException) as raised:
        _call("Bearer ", "")
    assert raised.value.status_code == 503


def test_no_token_configured_refuses_a_bare_request():
    with pytest.raises(HTTPException) as raised:
        _call("", "")
    assert raised.value.status_code == 503


def test_the_old_placeholder_is_no_longer_a_key():
    with pytest.raises(HTTPException) as raised:
        _call("Bearer change-me", "")
    assert raised.value.status_code == 503


def test_a_configured_token_still_opens_the_door():
    _call("Bearer s3cret-and-long-enough", "s3cret-and-long-enough")


def test_a_wrong_token_is_refused_as_before():
    with pytest.raises(HTTPException) as raised:
        _call("Bearer wrong", "s3cret-and-long-enough")
    assert raised.value.status_code == 401
