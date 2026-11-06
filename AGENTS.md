# AGENTS.md — building a Custom REST integration with an AI coding agent

This repository describes the REST API a merchant implements so the **EcommX AI** Gateway can
read their catalog. If you're an AI agent generating that implementation, read this first.

> **Only the custom REST path writes code.** If the merchant's store is on **Shopify** or
> **WooCommerce**, there's nothing to build — they just connect an API key (see
> `docs/platforms/shopify/` or `docs/platforms/woocommerce/`). This guide is for the custom-REST path.
>
> Asked to put the **website AI assistant** on the merchant's own site, or to make the dashboard
> count add-to-cart and orders? That is front-end work — jump to
> [Optional: storefront widget](#optional-storefront-widget).

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
  "url": "https://shop.acme.com/products/prd_001",   // optional; product page → assistant cards become clickable
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

## Optional: storefront widget

Everything above is server-to-server. This section is the only part that touches the merchant's
**web pages**, and it is optional: putting the EcommX AI website assistant on a site the merchant
built themselves. Full guide:
[`docs/platforms/custom-rest/storefront-widget.md`](docs/platforms/custom-rest/storefront-widget.md).
Runnable pages: [`examples/storefront-widget-custom-site`](examples/storefront-widget-custom-site).

### What you add

1. **Install code** — one `<script>` tag before `</body>` on **every** page, including the
   thank-you page. The merchant copies it from the dashboard; do not invent the values.

   ```html
   <script
     src="https://widget.ecommxai.com/widget.js"
     data-widget-key="wgt_YOUR_KEY"
     data-api-base="https://your-shop.ecommxai.com"></script>
   ```

2. **Report add-to-cart** — one line, run after the merchant's cart API returned 2xx:

   ```js
   (window.EcommXAIWidgetQueue = window.EcommXAIWidgetQueue || []).push(["track", "cart_added"]);
   ```

3. **Report the order** — one call on the thank-you page, before or after the install code:

   ```js
   (window.EcommXAIWidgetQueue = window.EcommXAIWidgetQueue || []).push(["track", "order_placed", {
     order_id: "A20260928-0001",
     order_number: "0001",
     total_price: "1450.00",
     currency: "TWD",
     financial_status: "paid",
     line_items: [{ sku: "abc", quantity: 1, price: "1450.00" }]
   }]);
   ```

### Hard rules (do not violate)

1. **Two event names only**: `cart_added` (takes no data) and `order_placed`. Any other name is
   ignored.
2. **Always write the queue line exactly as above.** `window.EcommXAIWidgetQueue` is a plain array
   the page creates; the same line works before and after the assistant loads. Do not wait for a
   load event, and do not poll for `window.EcommXAIWidget` (it does not exist until the install
   code has loaded, so calling it early throws).
3. **`order_id` is required.** A string of up to 64 characters, or an integer no larger than
   2^53-1 (it is turned into a string, so `42` and `"42"` are the same order). If it is missing or
   too long, nothing is sent; never shorten it yourself.
4. **Whitelist.** `order_placed` reads only `order_id`, `order_number`, `total_price`, `currency`,
   `financial_status`, and `line_items[].{sku, quantity, price}`. Any other key is dropped (it does
   no harm, and it does nothing), so do not add any. `order_id` alone is enough for the order to be
   counted. `price` is the price of one unit; amounts are in the currency's main unit. Only the
   first 200 `line_items` are read. An optional field with no value can be left out or set to `null`.
5. **No personal data.** Never send names, email addresses, phone numbers or postal addresses, in
   any field. Values that look like an email address are discarded; an `order_id` that looks like
   one rejects the whole event.
6. **Report `cart_added` after the cart API succeeded**, never on click.
7. **Do not build the HTTP request yourself.** Events sent straight to the endpoint are accepted
   but never mark the store as connected. Use the queue or `EcommXAIWidget.track()`.
8. **Do not read or store a visitor ID.** The assistant adds it internally; the page never sees it.
9. **The assistant key (`wgt_…`) is public; the catalog Bearer token is not.** Never put the Bearer
   token in a web page.
10. **One assistant key per page.**
11. **Steps are independent.** The cart bridge (`window.EcommXAIWidgetActions`) is not needed for
    reporting. Do not add it unless asked.
12. **Report the order whatever its payment status.** `financial_status` does not change what is
    counted.

The install code may carry `async` or `defer`. If the site sends a Content-Security-Policy, see
[the guide](docs/platforms/custom-rest/storefront-widget.md#if-your-site-sends-a-content-security-policy)
for the four directives to allow.

### Self-check before you call it done

- Add to cart (first time) → the Network tab shows `POST …/storefront-agent/attribution` → `200`
  with `{"accepted": true, …}`.
- Open the thank-you page (first time for this order) → a second request of the same kind, carrying
  the `order_id`.
- Reload the thank-you page → no request is sent and no new order is counted. To test again, use a
  new order ID.
- `EcommXAIWidget.track("cart_added")` in the console returns `true` the first time, then `false`
  for the same visitor in the same conversation on the same day. That is de-duplication, not a
  fault. If you already added to the cart above, that was the first time.
- `401` or `403` in the Network tab → the site's address (scheme, host and port) is not in the
  allowed addresses, or the key was regenerated.
