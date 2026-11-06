# Webhooks & checkout (optional)

Day-1 you need none of this. Add it later to unlock platform-driven checkout and real-time updates.

## Checkout (optional)

Three endpoints let the platform drive checkout against your system. They are
`x-status: stable` in the [OpenAPI spec](../../../openapi/custom-rest.v1.yaml) (the authoritative,
field-by-field schema) — the Gateway does not call them until your integration enables checkout.

| Path | Purpose |
|---|---|
| `POST /checkout/reserve` | Live-check + hold stock before payment (idempotent). |
| `POST /checkout/calculate-totals` | Tax / shipping / discount (non-mutating). |
| `POST /checkout/complete` | Create the order (buyer + already-authorized payment). |

### Who charges the card

**The platform charges payment, not you.** When a buyer checks out through an AI channel, the
platform authorizes the card through its own payment integration **against your PSP account** (the
money lands in your account), then calls `POST /checkout/complete` with a
`payment_authorization_id` for reconciliation. Your endpoint **never receives a raw payment token
and must not charge** — it only records the order, and must build it at the `totals.total_cents`
the platform sends (the amount already authorized). Do not recompute a different total.

### Idempotency

Persist the `Idempotency-Key` header **per endpoint** on `reserve` and `complete`:

- same key + same payload → return the **same** stored response (no duplicate order / hold)
- same key + different payload → `409 { "error": { "type": "idempotency_conflict" } }`

`calculate-totals` is non-mutating, so the header is accepted but not required. Recommended store TTL ≥ 24h.

### `POST /checkout/reserve`

```bash
curl -sX POST "$BASE/checkout/reserve" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "Idempotency-Key: 6f1c-..." \
  -d '{"skus_qty":{"TENT-2P-GREEN":2,"STOVE-MSR":1},"currency":"USD"}'
```
```json
{
  "status": "oversold",
  "per_sku_available": { "TENT-2P-GREEN": 12, "STOVE-MSR": 0 },
  "oversold_skus": ["STOVE-MSR"],
  "reservation": { "id": "rsv_abc", "expires_at": "2026-06-17T12:15:00Z" }
}
```
`status: "oversold"` is a normal **200** outcome (the platform tells the buyer), not an error. Hold
stock 5-15 minutes via `reservation.expires_at`.

### `POST /checkout/calculate-totals`

```bash
curl -sX POST "$BASE/checkout/calculate-totals" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"items":[{"sku":"TENT-2P-GREEN","quantity":2,"unit_price_cents":29900}],
       "currency":"USD","shipping_address":null,"promotion_codes":["SAVE10"]}'
```
```json
{
  "subtotal_cents": 59800, "tax_cents": 4800, "shipping_cents": 0,
  "discount_cents": 5980, "total_cents": 58620, "currency": "USD",
  "breakdown": [{ "type": "discount", "display_text": "SAVE10", "amount": -5980 }],
  "metadata": { "rejected_promotion_codes": [] }
}
```
Formula: `total = subtotal + tax + shipping - discount`. The `breakdown` array may carry
subtotal / tax / shipping / discount line items (the example shows only the discount). An
unknown / expired promo code does **not** fail the call — omit it from the discount and list it
under `metadata.rejected_promotion_codes`. Digital goods: send `shipping_address: null` and
`shipping_cents: 0`.

### `POST /checkout/complete`

```bash
curl -sX POST "$BASE/checkout/complete" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "Idempotency-Key: 6f1c-..." \
  -d '{"cart_id":"0190-...","currency":"USD",
       "items":[{"sku":"TENT-2P-GREEN","quantity":2,"unit_price_cents":29900}],
       "buyer":{"email":"buyer@example.com"},
       "shipping_address":null,
       "totals":{"...":"the calculate-totals response"},
       "payment_authorization_id":"pa_xxx","reservation_id":"rsv_abc"}'
```
```json
{ "merchant_order_id": "456", "confirmation_number": "#1001",
  "status": "created", "total_cents": 58620, "currency": "USD" }
```
Return **201** for a new order, **200** when replaying an idempotent retry. If stock is gone at
completion → `409 inventory_oversold`; if the reservation expired → `409 reservation_expired`.

See the [OpenAPI spec](../../../openapi/custom-rest.v1.yaml) for every field, type, and error code.

## Webhooks (you → Gateway)

Webhooks flow **from your store to EcommX AI**, not the other way. They replace the periodic
reconcile poll with second-level freshness.

| Event | When |
|---|---|
| `order-created` / `order-updated` | Order placed / status changed. |
| `refund-issued` | A refund happens. |
| `inventory-changed` | Stock moves (instead of waiting for the reconcile interval). |
| `product-deleted` | A product is delisted. |

Without webhooks the platform reconciles your catalog periodically; with them, delisting and stock
changes propagate in seconds. Signing and verification details are provided when you enable webhooks.

**Next:** [FAQ](faq.md).
