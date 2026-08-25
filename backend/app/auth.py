import secrets

from fastapi import Header, HTTPException

from app.config import settings


async def require_admin(authorization: str = Header(default="")) -> None:
    """Same contract as the Next.js API: Authorization: Bearer <ADMIN_TOKEN>.

    With no ADMIN_TOKEN configured every write is refused. A missing secret
    must never mean "allow everyone": the failure of a deployment step is
    then a service nobody can post to, which somebody notices, rather than
    a service anybody can post to, which nobody does.
    """
    if not settings.admin_token:
        raise HTTPException(status_code=503, detail="No admin token configured")
    expected = f"Bearer {settings.admin_token}"
    if not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing admin token")
