# Data model

These are the shapes the Gateway expects. The starters already emit them; if you implement from
scratch, match them exactly. Source of truth: [`openapi/custom-rest.v1.yaml`](../../../openapi/custom-rest.v1.yaml).

## Product

| Field | Type | Notes |
|---|---|---|
| `id` | string | Your product id. |
| `title` | string | Product name. |
| `description` | string \| null | |
| `category_id` | string | A single `Category.id`. |
| `vendor` | string \| null | Brand. Useful for agent display. |
| `tags` | string[] | Free-form tags for search. |
| `images` | string[] | Image URLs (a product can have several). |
| `variants` | Variant[] | One or more; see below. |
| `updated_at` | string (ISO 8601 UTC) \| null | Enables incremental sync. |

## Variant

| Field | Type | Notes |
|---|---|---|
| `sku` | string | **Primary key** — unique within your store. |
| `title` | string \| null | Optional display name (e.g. `"M · Navy"`). |
| `attributes` | object | Free-form options: `{ "size": "M", "color": "Navy" }`. Extensible — add `material`, `length`, etc. |
| `price` | `{ amount, currency }` | See Price. |
| `inventory` | integer \| null | Available quantity. Return `0` (not null) when sold out. |

## Price

| Field | Type | Notes |
|---|---|---|
| `amount` | string | Decimal **string** to avoid float drift, e.g. `"189.00"`. |
| `currency` | string | ISO 4217 three-letter code (`USD`, `TWD`, `JPY`). |

## Category

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | |
| `parent_id` | string \| null | Points to another `Category.id`; `null` for a root. |

## Rules that trip people up

- **Money is a string.** `price.amount` = `"189.00"`, never a float or integer-cents.
- **SKU is the key.** The whole system aligns on `variant.sku`; your `product.id` can be anything.
- **Inventory `0` ≠ unknown.** In `GET /inventory`, return `0` for out-of-stock; **omit** unknown SKUs.
- **Variant options go in `attributes`**, an extensible dict — not flat fixed fields.
- **One product can have many `images`** — it's an array.

**Next:** [Error handling](error-handling.md) · [FAQ](faq.md).
