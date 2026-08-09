"""
┌───────────────────────────────────────────────────────────────────────────┐
│  THIS IS THE FILE YOU CHANGE.                                              │
│  Implement the 4 functions below against your own DB / OMS.               │
│  Keep the return shapes (see docs/06-data-model.md). Everything else —     │
│  endpoints, pagination cursor, auth — lives in routes.py (DON'T edit).     │
└───────────────────────────────────────────────────────────────────────────┘

Out of the box these use an in-memory DEMO catalog so a fresh clone just runs.
"""

from __future__ import annotations

# ⬇⬇⬇ DEMO data — delete once your functions read from your system ⬇⬇⬇
DEMO_CATEGORIES = [
    {"id": "cat_outdoor", "name": "Outdoor", "parent_id": None},
    {"id": "cat_camping", "name": "Camping", "parent_id": "cat_outdoor"},
    {"id": "cat_tents", "name": "Tents", "parent_id": "cat_camping"},
    {"id": "cat_cooking", "name": "Cooking", "parent_id": "cat_camping"},
]

DEMO_PRODUCTS = [
    {
        "id": "p_001",
        "title": "Northwild 3-Season Tent",
        "description": "Lightweight 2-person tent for 3-season use.",
        "category_id": "cat_tents",
        "vendor": "Northwild Outfitters",
        "tags": ["tent", "camping", "3-season"],
        "images": ["https://example.com/tent.jpg"],
        "variants": [
            {"sku": "TENT-2P-GREEN", "title": "2-person · Green", "attributes": {"size": "2P", "color": "green"}, "price": {"amount": "299.00", "currency": "USD"}, "inventory": 12},
            {"sku": "TENT-2P-ORANGE", "title": "2-person · Orange", "attributes": {"size": "2P", "color": "orange"}, "price": {"amount": "299.00", "currency": "USD"}, "inventory": 3},
        ],
    },
    {
        "id": "p_002",
        "title": "MSR PocketRocket 2 Stove",
        "description": "Compact backpacking stove.",
        "category_id": "cat_cooking",
        "vendor": "MSR",
        "tags": ["stove", "cooking", "backpacking"],
        "images": ["https://example.com/stove.jpg"],
        "variants": [
            {"sku": "STOVE-MSR", "title": "Default", "attributes": {}, "price": {"amount": "49.95", "currency": "USD"}, "inventory": 0},
        ],
    },
]
# ⬆⬆⬆ DEMO data ⬆⬆⬆


# 👇 REPLACE: return one page of products + the total count.
#    e.g. SELECT ... FROM products [WHERE category=?] ORDER BY id LIMIT ? OFFSET ?  (+ COUNT(*))
async def list_products(*, offset: int, limit: int, category_id: str | None = None) -> dict:
    pool = DEMO_PRODUCTS if category_id is None else [p for p in DEMO_PRODUCTS if p["category_id"] == category_id]
    return {"items": pool[offset : offset + limit], "total": len(pool)}


# 👇 REPLACE: look up one product by product id OR variant SKU; None if not found.
async def get_product(id_or_sku: str) -> dict | None:
    by_id = next((p for p in DEMO_PRODUCTS if p["id"] == id_or_sku), None)
    if by_id:
        return by_id
    return next((p for p in DEMO_PRODUCTS if any(v["sku"] == id_or_sku for v in p["variants"])), None)


# 👇 REPLACE: return all categories.
async def list_categories() -> list[dict]:
    return DEMO_CATEGORIES


# 👇 REPLACE: return { sku: available_qty } for the asked SKUs; omit SKUs you don't have.
async def get_inventory(skus: list[str]) -> dict[str, int]:
    wanted = set(skus)
    out: dict[str, int] = {}
    for p in DEMO_PRODUCTS:
        for v in p["variants"]:
            if v["sku"] in wanted:
                out[v["sku"]] = v["inventory"]
    return out
