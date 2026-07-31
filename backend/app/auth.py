import secrets

from fastapi import Header, HTTPException

from app.config import settings


async def require_admin(authorization: str = Header(default="")) -> None:
    """Same contract as the Next.js API: Authorization: Bearer <ADMIN_TOKEN>."""
    expected = f"Bearer {settings.admin_token}"
    if not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing admin token")
