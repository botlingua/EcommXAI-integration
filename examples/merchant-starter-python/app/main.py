"""EcommX AI 商家整合 starter — Python / FastAPI entry。

兩個 module：
  MODULE=commerce → 只裝 5 day-1 commerce endpoint
  MODULE=full     → commerce + OAuth Authorization Server (M8 identity linking)
"""

from __future__ import annotations

import os

from fastapi import FastAPI

from app.commerce.routes import router as commerce_router

MODULE = os.getenv("MODULE", "commerce")

app = FastAPI(
    title="ecommxai-merchant-starter-python",
    description=f"EcommX AI 商家整合 starter（module={MODULE}）",
    version="0.1.0",
)


@app.get("/health", tags=["health"])
def health() -> dict:
    """§3.5 健康檢查；不需要 auth。"""
    return {"status": "ok", "version": "v1", "module": MODULE}


app.include_router(commerce_router)

if MODULE == "full":
    from app.oauth.routes import router as oauth_router

    app.include_router(oauth_router)
