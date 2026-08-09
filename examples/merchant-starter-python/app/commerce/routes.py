"""
┌───────────────────────────────────────────────────────────────────────────┐
│  DON'T EDIT (platform contract).                                          │
│  Day-1 endpoints + opaque pagination cursor + JSON shapes.                │
│  These call the provider in data.py — change your catalog source there.   │
└───────────────────────────────────────────────────────────────────────────┘
Aligned with openapi/custom-rest.v1.yaml.
"""

from __future__ import annotations

import base64
import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import require_bearer

from . import data

router = APIRouter()

DEFAULT_LIMIT = 50
MAX_LIMIT = 200


# Opaque cursor = base64url({"o": offset}). The platform round-trips it verbatim; merchants
# never see or implement it — that's why pagination lives here, not in the provider.
def _encode_cursor(offset: int) -> str:
    return base64.urlsafe_b64encode(json.dumps({"o": offset}).encode()).decode().rstrip("=")


def _decode_cursor(cursor: str | None) -> int:
    if not cursor:
        return 0
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        return int(json.loads(base64.urlsafe_b64decode(padded).decode()).get("o", 0))
    except Exception:
        return 0


@router.get("/products", dependencies=[Depends(require_bearer)])
async def list_products(
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = DEFAULT_LIMIT,
    cursor: str | None = None,
    category_id: str | None = None,
) -> dict:
    offset = _decode_cursor(cursor)
    page = await data.list_products(offset=offset, limit=limit, category_id=category_id)
    next_offset = offset + limit
    next_cursor = _encode_cursor(next_offset) if next_offset < page["total"] else None
    return {"items": page["items"], "next_cursor": next_cursor, "total": page["total"]}


@router.get("/products/{product_id}", dependencies=[Depends(require_bearer)])
async def get_product(product_id: str) -> dict:
    product = await data.get_product(product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"type": "not_found", "message": f"id {product_id} not found"}},
        )
    return product


@router.get("/categories", dependencies=[Depends(require_bearer)])
async def list_categories() -> dict:
    return {"items": await data.list_categories()}


@router.get("/inventory", dependencies=[Depends(require_bearer)])
async def get_inventory(skus: str = Query("", description="comma-separated SKUs")) -> dict:
    raw = [s.strip() for s in skus.split(",") if s.strip()]
    if len(raw) > MAX_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"type": "invalid_request", "message": f"max {MAX_LIMIT} skus per call"}},
        )
    inv = await data.get_inventory(raw)
    return {"items": [{"sku": s, "available": inv[s]} for s in raw if s in inv]}
