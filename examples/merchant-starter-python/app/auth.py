"""Bearer token 驗證 — 對齊 docs/integration/custom-rest.md §5。"""

from __future__ import annotations

import os

from fastapi import Header, HTTPException, status

_EXPECTED = os.getenv("MERCHANT_BEARER", "dev-bearer-replace-me")


def require_bearer(authorization: str = Header(default="")) -> None:
    """FastAPI dependency — 驗證 Bearer token；失敗 raise 401。"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"type": "unauthorized", "message": "missing bearer token"}},
        )
    token = authorization[len("Bearer ") :]
    if token != _EXPECTED:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"type": "unauthorized", "message": "invalid bearer token"}},
        )
