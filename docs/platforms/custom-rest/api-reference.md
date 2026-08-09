# API reference — Day-1 endpoints

The authoritative, machine-readable contract is [`openapi/custom-rest.v1.yaml`](../../../openapi/custom-rest.v1.yaml).
This page is the human-readable companion. Implement these five and AI agents can browse your catalog.

All endpoints except `/health` require `Authorization: Bearer <token>`. See [Auth](connect.md#auth)
for token setup.

---

## `GET /health`

Liveness probe. **No auth.** Used by the dashboard "Test connection" button and platform monitoring.

```bash
curl -s https://api.acme.com/v1/health
# 200 → { "status": "ok", "version": "v1" }
```

Return `200` + `{"status":"ok"}` — don't query your DB here.

---

## `GET /products`

Paginated product list. Each product carries its variants; the Gateway flattens every variant into
one catalog item keyed by SKU.

**Query:** `limit` (default 50, max 200) · `cursor` (opaque; from previous `next_cursor`) · `category_id` (optional)

```bash
curl -sH "Authorization: Bearer $TOKEN" "https://api.acme.com/v1/products?limit=10"
```

```jsonc
{
  "items": [
    {
      "id": "p_001",
      "title": "Northwild 3-Season Tent",
      "description": "...",
      "category_id": "cat_tents",
      "vendor": "Northwild Outfitters",
      "tags": ["tent", "camping"],
      "images": ["https://..."],
      "variants": [
        {
          "sku": "TENT-2P-GREEN",
          "title": "2-person · Green",
          "attributes": { "size": "2P", "color": "green" },
          "price": { "amount": "299.00", "currency": "USD" },
          "inventory": 12
        }
      ],
      "updated_at": "2026-05-10T08:00:00Z"
    }
  ],
  "next_cursor": "eyJvIjoxMDB9",   // null on the last page
  "total": 152                       // optional
}
```

See [Data model](data-model.md) for every field. `next_cursor` is opaque — return `null`
(not `""`) on the last page.

---

## `GET /products/{id}`

Get one product by product id **or** variant SKU. **Optional** — the platform can fall back to
`/products` + linear filter, but implementing this makes large catalogs (10k+ SKUs) much faster.

```bash
curl -sH "Authorization: Bearer $TOKEN" "https://api.acme.com/v1/products/p_001"
# 200 → one product object (same shape as an item above)
# 404 → { "error": { "type": "not_found", "message": "id p_001 not found" } }
```

---

## `GET /categories`

All categories. Express a tree with self-referential `parent_id` (root → `null`).

```bash
curl -sH "Authorization: Bearer $TOKEN" "https://api.acme.com/v1/categories"
```

```json
{
  "items": [
    { "id": "cat_camping", "name": "Camping", "parent_id": null },
    { "id": "cat_tents", "name": "Tents", "parent_id": "cat_camping" }
  ]
}
```

---

## `GET /inventory`

Batch inventory lookup. Max 200 SKUs per call (the platform auto-batches larger sets).

```bash
curl -sH "Authorization: Bearer $TOKEN" "https://api.acme.com/v1/inventory?skus=TENT-2P-GREEN,STOVE-MSR"
```

```json
{ "items": [ { "sku": "TENT-2P-GREEN", "available": 12 }, { "sku": "STOVE-MSR", "available": 0 } ] }
```

**Omit** SKUs that don't exist (so the platform can tell "out of stock" `available: 0` from "unknown
SKU"). See the [FAQ](faq.md) for the reasoning.

---

## Optional endpoints

Beyond the five above, you can add later (not needed day-1):

- **Checkout** — let the platform drive reserve / totals / order creation. These are in the
  [OpenAPI spec](../../../openapi/custom-rest.v1.yaml) marked `x-status: planned`.
- **Webhooks** — push catalog changes (orders, inventory, delistings) to EcommX AI for second-level
  freshness, instead of waiting for the periodic reconcile.

See [Webhooks & checkout](webhooks-and-checkout.md) for both.

---

**Next:** [Connect & go live](connect.md) · [Data model](data-model.md) ·
[Error handling](error-handling.md).
