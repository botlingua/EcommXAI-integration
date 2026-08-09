# AGENTS.md — building a Custom REST integration with an AI coding agent

This repository describes the REST API a merchant implements so the **EcommX AI** Gateway can
read their catalog. If you're an AI agent generating that implementation, read this first.

> **Only the custom REST path writes code.** If the merchant's store is on **Shopify** or
> **WooCommerce**, there's nothing to build — they just connect an API key (see
> `docs/platforms/shopify/` or `docs/platforms/woocommerce/`). This guide is for the custom-REST path.

## The one job

Expose these 5 endpoints, matching [`openapi/custom-rest.v1.yaml`](openapi/custom-rest.v1.yaml)
**exactly**: `GET /health`, `GET /products`, `GET /products/{id}`, `GET /categories`,
`GET /inventory`. The OpenAPI file is the source of truth for every request/response shape —
generate your client or validate your server against it.

## Hard rules (do not violate)

1. **Credential direction is merchant → platform.** The merchant generates a Bearer token; the
   platform never issues one. Validate `Authorization: Bearer <token>` on every endpoint except `/health`.
2. **Money is a decimal string.** `price.amount` is a string like `"189.00"` (avoids float drift).
   Never emit a float or an integer-cents field here.
3. **SKU is the primary key.** Each `variant.sku` is unique within the store; it's how the platform
   identifies items.
4. **Inventory 0 ≠ unknown.** In `GET /inventory`, return `{"sku": X, "available": 0}` for
   out-of-stock; **omit** the SKU entirely if it doesn't exist (so the platform can tell them apart).
5. **`next_cursor` is opaque.** The platform round-trips it verbatim; encode whatever you like
   (offset, keyset). Return `null` (not `""`) on the last page.
6. **Don't change the contract shape.** If you start from a starter in `examples/`, you may change
   the **data provider** (where the catalog comes from) but must keep the endpoint paths and JSON
   shapes identical — that is the platform contract.

## Product / variant shape (the part people get wrong)

```jsonc
{
  "id": "prd_001",
  "title": "Trailhead Fleece Jacket",        // product name lives in `title`
  "category_id": "fleece",
  "vendor": "Northwild Outfitters",
  "tags": ["fleece", "jacket"],
  "images": ["https://..."],                  // array, not a single image_url
  "variants": [
    {
      "sku": "NWO-TRAIL-FLC-S-NAVY",
      "title": "S · Navy",
      "attributes": { "size": "S", "color": "Navy" },   // free-form dict, extensible
      "price": { "amount": "189.00", "currency": "USD" }, // string amount, ISO-4217 currency
      "inventory": 8                                       // integer quantity; 0 = sold out
    }
  ],
  "updated_at": "2026-05-10T08:00:00Z"
}
```

## Fastest correct path

1. Fork a starter: `examples/merchant-starter-node` (Express) or `examples/merchant-starter-python`
   (FastAPI). Both already match the contract.
2. Replace the catalog **data provider** (the in-memory fixture) with calls to the merchant's real
   DB / OMS — keep the response shapes above.
3. Set the `MERCHANT_BEARER` the merchant will configure in the dashboard.
4. Self-check (below).

## Self-check before you call it done

- `GET /health` → `200 {"status":"ok"}` with no auth.
- No token → 401; wrong token → 401; correct token → 200.
- `GET /products` → `items[]` where each variant has `sku`, `attributes`,
  `price: {amount(string), currency}`, `inventory(int)`.
- `GET /inventory?skus=A,B` → `{items:[{sku,available}]}`, omitting unknown SKUs.
- `GET /categories` → tree via `parent_id` (root has `parent_id: null`).

If you can, point the EcommX AI Gateway (or the starter integration test) at your Base URL and
confirm a catalog sync succeeds end-to-end.
