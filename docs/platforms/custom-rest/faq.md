# FAQ

**My store address returns HTTP 503 — what did I break?**
Most likely nothing. Until you verify the email you signed up with, every agent-facing endpoint
(`.well-known/agent-card.json`, A2A / ACP / UCP) returns 503 by design. Click the link in the
verification email — or resend it from the banner in your dashboard — and serving starts immediately.
See [Register → Verify your email](../../common/register.md#verify-your-email).

**Do I have to implement `GET /products/{id}`?**
No. The platform falls back to `/products` + linear filter — fine for < 1k SKUs; strongly recommended
for large catalogs.

**How many SKUs can `/inventory` take at once?**
Up to 200. The platform auto-batches more; if any batch fails the whole call fails (no partial results).

**How do I express a category tree?**
Self-referential `parent_id` (see [doc 4](api-reference.md)). A root category has `parent_id: null`.

**How do I store price and currency?**
Price as a decimal **string** (`"189.00"`) to avoid float drift; currency as an ISO 4217 code
(`USD` / `TWD` / `JPY`) inside the `price` object.

**How do I express variants (color / size)?**
A `variants[]` array; each variant has its own `sku` and an `attributes` dict. The platform flattens
each variant into one catalog item.

**Inventory 0 — out of stock, or doesn't exist?**
`0` → return `{"sku":"X","available":0}` (out of stock). Unknown SKU → **omit** it, so the caller can
tell the two apart.

**Are webhooks required?**
No. Day-1 works without them; the platform reconciles periodically. Webhooks just make changes
propagate in seconds (see [doc 8](webhooks-and-checkout.md)).

**My product id and SKU differ — which is the key?**
SKU. The system aligns on `variant.sku`; `product.id` can be your internal id.

**Do I need HTTPS?**
Production: yes. Dev: HTTP is allowed during onboarding.

**What if my API is slow (> 30s)?**
Default timeout is 30s (configurable 5–60s in the dashboard). Timeouts count as connection failures;
repeated failures mark the connection unhealthy.

**I'm building this with an AI tool — where do I start?**
[`AGENTS.md`](../../../AGENTS.md) + the [OpenAPI spec](../../../openapi/custom-rest.v1.yaml). They're written so an
agent can generate a correct implementation in one pass.

**What about the chat / A2A endpoint?**
That's a different integration (your chat frontend → your BFF → the Gateway's A2A endpoint) and is out
of scope for this repo, which covers the **custom REST catalog contract**.
