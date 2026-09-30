# Website AI assistant on your own site

The custom REST integration needs **no change to your storefront**. This page covers the optional
part that does: putting the **EcommX AI website assistant** (a chat bubble your visitors can ask
about products) on a site you built yourself, and letting the dashboard count what happens after
they ask.

There are three steps. Step 1 is needed for the other two. Steps 2 and 3 do not depend on each
other: do either, both, or neither.

A note on names: the dashboard calls this feature **Website AI Agent**, and shows its results on
the **AI assistant impact** card. This guide calls it "the assistant". Elsewhere in this
repository you may also see "website AI assistant", "storefront assistant" or "storefront
widget". They are all the same thing.

| Step | What you add to your pages | What you get |
|---|---|---|
| 1. [Install code](#1-install-the-assistant) | One `<script>` tag, site-wide | The assistant appears; visitors can ask about your catalog |
| 2. [Cart bridge](#2-let-the-assistant-add-to-your-cart-optional) | One global object | Product cards in the chat get an "Add to cart" button |
| 3. [Report add-to-cart and orders](#3-report-add-to-cart-and-orders-optional) | Two short calls | The dashboard's impact card fills in "Added to cart" and "Ordered" |

> Building this with an AI coding tool? Everything the tool needs is on this page and in
> [`AGENTS.md`](../../../AGENTS.md#optional-storefront-widget). A runnable example lives in
> [`examples/storefront-widget-custom-site`](../../../examples/storefront-widget-custom-site).

## Before you start

- Your store is [connected](connect.md) and the catalog has synced. The assistant answers from that
  catalog. Without it the bubble still appears and reporting still works, but the assistant has no
  products to answer with.
- In the dashboard, open **Agentic AI → Agent Endpoint → Website AI Agent**. Enter the addresses of
  the sites allowed to use the assistant (for example `https://shop.example.com`), then choose
  **Create key**.
- The dashboard shows your **install code once**, right after the key is created. Copy it then. If
  you lose it, regenerate the key: the old key stops working immediately, so paste the new install
  code into your site right away.

The assistant key is public. It appears in your page source, and that is expected: it only works
from the addresses you allowed. It is **not** the Bearer token you use for the catalog API. Never
put that token in a web page.

## 1. Install the assistant

Paste the install code from your dashboard just before `</body>` on **every page**, including the
thank-you page shown after checkout. It has this shape:

```html
<script
  src="https://widget.ecommxai.com/widget.js"
  data-widget-key="wgt_YOUR_KEY"
  data-api-base="https://your-shop.ecommxai.com"></script>
```

| Attribute | Required | Meaning |
|---|---|---|
| `src` | yes | Where the assistant script is served from. Use the value from your dashboard. |
| `data-widget-key` | yes | Your public assistant key (`wgt_…`). |
| `data-api-base` | yes | Your store address on EcommX AI. Without it the assistant cannot reach your catalog. |
| `data-locale` | no | The language the assistant speaks: `en` or `zh-TW`. Any value starting with `zh` means `zh-TW`; anything else means English. Without it, the visitor's browser language decides, by the same rule. |

You may add `async` or `defer` to the tag. The assistant never blocks your page from rendering.

Each environment has its own install code. A code copied from a test environment points at test
addresses and only works there; before going live, copy the install code from your production
dashboard.

Reload your site. A chat bubble appears in the bottom-right corner. If it does not:

- Your site's address must match one of the allowed addresses **exactly**. Only the scheme, host
  and port are compared, not the path, so one entry covers every page of that site. Production
  keys only accept `https://` addresses.
- Use one key per page. If two install codes are on the same page, the last one to start takes
  over.

### If your site sends a Content-Security-Policy

Allow these four things, or the assistant is blocked by the browser. Add exactly these sources to
the directives you already have. Do not use `*`.

| Directive | Add this source | Example | Without it |
|---|---|---|---|
| `script-src` | The origin of the install code's `src` | `https://widget.ecommxai.com` | The assistant does not load at all |
| `connect-src` | The origin of `data-api-base` | `https://your-shop.ecommxai.com` | The bubble appears but cannot answer, and nothing is reported |
| `img-src` | The origins your catalog's image URLs point to | `https://cdn.your-shop.com` | Product cards in the chat show no picture |
| `style-src` | `'unsafe-inline'` | | The assistant appears unstyled |

About `style-src 'unsafe-inline'`: the assistant adds a `<style>` element inside its own shadow
root. That element does not change how your page looks, but the directive applies to your whole
page, so allowing it means your policy no longer blocks inline styles anywhere on the page. It does
**not** allow inline scripts. The install code cannot take a nonce, and the assistant's styles
change with your appearance settings, so a fixed hash would not keep working. If your policy cannot
allow inline styles, the assistant is not usable on that site yet.

## 2. Let the assistant add to your cart (optional)

By default, product cards in the chat link to your product page. To give them an "Add to cart"
button, define one global object **before** the install code. The assistant calls it in the
visitor's browser; EcommX AI never sees or stores your cart.

```html
<script>
  window.EcommXAIWidgetActions = {
    // items: [{ variant_ref, quantity, title?, merchant_sku?, product_url? }]
    // variant_ref is the variant.sku you return from GET /products; quantity is an integer 1-99
    async addToCart(items) {
      for (const item of items) {
        const res = await fetch("/api/cart/add", {            // <- your own cart API
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ sku: item.variant_ref, quantity: item.quantity }),
        });
        if (res.status === 409) {
          return { ok: false, reason: "out_of_stock", message: "Out of stock" }; // message is shown to the visitor
        }
        if (!res.ok) return { ok: false, reason: "error" };
      }
      return { ok: true, itemCount: await this.getCartCount() };
    },
    // optional: current number of items in the cart; return null if unknown
    async getCartCount() {
      const res = await fetch("/api/cart", { credentials: "same-origin" });
      return res.ok ? (await res.json()).item_count : null;
    },
    // optional: where "View cart" should take the visitor
    cartUrl: "/cart",
  };
</script>
```

Rules:

- Return `{ ok: true, itemCount }` when everything was added. On failure return
  `{ ok: false, reason, message?, addedBefore? }`, where `reason` is one of `out_of_stock` (you
  refused; `message` is shown to the visitor as written), `unavailable` (nothing was refused, but
  nothing was added either, such as an unknown SKU), or `error` (anything else). When several items
  are added one by one and one fails, put the number already added in `addedBefore` so a retry does
  not add them twice.
- The button only appears for products with **a single variant**. Products with sizes, colors or
  other options always send the visitor to the product page to choose.
- The assistant **never retries on its own**. After a successful add the button locks. After a
  failure it shows the reason and leaves the decision to the visitor.
- Without this object the assistant still works; it sends visitors to the product page to add.
- Nothing checks this code for you. Click the button on your own site once to confirm it works.

## 3. Report add-to-cart and orders (optional)

The dashboard's **AI assistant impact** card (Agentic AI → Agent to Agent → Insights) follows
visitors through five steps: Visitors → Opened assistant → Asked → Added to cart → Ordered. The
assistant can see the first three by itself. The last two happen in **your** pages, so your site
has to tell it. Until it does, the card shows "Order reporting not connected yet" and counts only
the items the assistant added to the cart.

Add these two calls. They are the whole integration; what takes the time is mapping your own order
data onto the fields.

<!-- snippet:custom-site-report -->
```html
<script>
  // 1. Where add-to-cart succeeds (after your cart API returns 2xx)
  (window.EcommXAIWidgetQueue = window.EcommXAIWidgetQueue || []).push(["track", "cart_added"]);
</script>
```

```html
<script>
  // 2. Thank-you page (the page shown once the order exists); before or after the install code
  (window.EcommXAIWidgetQueue = window.EcommXAIWidgetQueue || []).push(["track", "order_placed", {
    order_id: "A20260928-0001",      // required; your order ID (string, or a safe integer up to 2^53-1)
    order_number: "0001",             // optional; the order number shown to the buyer
    total_price: "1450.00",           // optional; string or number, stored as a string
    currency: "TWD",                  // optional; ISO 4217
    financial_status: "paid",         // optional; paid / unpaid or your own status (32 characters max)
    line_items: [{ sku: "abc", quantity: 1, price: "1450.00" }]  // optional; up to 200 items
  }]);
</script>
```
<!-- /snippet:custom-site-report -->

### How the queue works

`window.EcommXAIWidgetQueue` is a plain array **you** create. Write the same line whether the
assistant has loaded or not:

- **Before the assistant loads**, the line pushes onto an ordinary array and waits.
- **When the assistant starts**, it sends what is already in the array (the first 50 entries;
  anything beyond that is dropped) and from then on sends each new `push` immediately.

So the thank-you page can report an order at the top of the page, before the install code, and
nothing is lost.

Once the assistant has loaded you may also call it directly. `EcommXAIWidget` does not exist
before the install code has loaded, so calling it earlier throws; the queue line above is always
safe.

```js
const accepted = EcommXAIWidget.track("cart_added");
const accepted2 = EcommXAIWidget.track("order_placed", { order_id: "A20260928-0001" });
```

`track` returns `true` when the event **passed the checks in the browser and was handed over for
sending**. It does not mean the platform has stored it. It returns `false` when nothing was sent:

- for both events: unknown event name, or the assistant has not started or is turned off;
- for `order_placed`: `order_id` is missing, longer than 64 characters, or looks like an email
  address; or this order was already reported from this browser;
- for `cart_added`: the visitor cannot be identified, because the browser blocks local storage (a
  privacy setting or an extension can do this); or the same visitor already reported an
  add-to-cart in the same conversation today. That last case is normal de-duplication, not a
  fault.

An order is sent even when the visitor cannot be identified. It is then counted under "orders that
couldn't be matched to a visitor".

A **conversation** here is the assistant's session in this browser. It starts when the assistant
loads on the page, whether or not the visitor ever opens the chat, and a new one starts when the
visitor chooses "New conversation". So add-to-cart is reported for visitors who never talk to the
assistant too.

Only two event names are accepted: `cart_added` and `order_placed`. Anything else is ignored.

### Fields of `order_placed`

`cart_added` takes no data. `order_placed` reads only these fields:

| Field | Required | Notes |
|---|---|---|
| `order_id` | yes | Your order ID, used to tell whether an order was already reported. A string of up to 64 characters. A number is accepted only if it is an **integer** no larger than 2^53-1; otherwise send a string. A number is turned into a string, so `42` and `"42"` are the same order. If it is missing or too long, **nothing is sent**; it is never shortened. |
| `order_number` | no | The order number shown to the buyer, up to 128 characters. |
| `total_price` | no | The order total as the buyer sees it, in the currency's main unit (`"480"` means 480 dollars, not 480 cents). `"480"` and `"480.00"` are both fine. String or number, up to 32 characters. Its absolute value must be below 100,000,000,000,000 after rounding to 4 decimal places. If it is too long, not a number, or too large, this field is treated as empty and the order is still recorded. |
| `currency` | no | ISO 4217 code, up to 8 characters. Longer values are treated as empty; the order is still recorded. |
| `financial_status` | no | `paid`, `unpaid`, or your own status, up to 32 characters. Longer values are treated as empty; the order is still recorded. It does not change what is counted: an order counts as "Ordered" whatever its status, so report it as soon as the order exists. |
| `line_items[]` | no | Only the first 200 entries are read; the rest are ignored. Each item reads only `sku` (up to 128 characters), `quantity` (an integer from 0 to 1,000,000) and `price` (the price of **one unit**; same limits as `total_price`). A value outside the limits is treated as empty; the item is still recorded. Use the same SKU as in your catalog if you can. It is not checked against the catalog. |

Lengths are counted in Unicode characters. An optional field with no value can be left out or set
to `null`; both mean "empty".

`order_id` alone is enough for an order to be counted. The optional fields are stored with the
order, but they are not shown on any screen and no number on the dashboard is calculated from
them: the dashboard counts orders, not amounts.

### Rules

- **Only the fields above are read.** Any other key is dropped. Sending extra keys never causes an
  order to be missed.
- **These fields are identifiers and status words. Do not put names, email addresses, phone numbers
  or postal addresses in them.** The platform discards values that look like an email address (that
  field becomes empty and the rest is recorded). An `order_id` that looks like an email address is
  rejected as a whole. The platform cannot recognise a person's name: what you put in is your
  responsibility. These values are never shown on any screen. They are used only to de-duplicate and
  count, and they are deleted together with the conversation after your retention period.
- **De-duplication.** The same `order_id` counts once, so reloading the thank-you page adds
  nothing. Add-to-cart counts once per visitor, per conversation, per day.
- **Report add-to-cart after your cart API succeeds**, not when the button is clicked. Otherwise
  failed attempts are counted.
- **With the cart bridge.** The assistant reports the items it adds by itself, so the bridge does
  not need to report them. If your cart code reports every successful add anyway, nothing is counted
  twice: add-to-cart counts visitors, not clicks.
- **Large orders.** One order report can carry about 48 KB. Beyond that, items are left out
  starting from the end of `line_items`; the order itself is still reported and counted.
- **Resending orders.** An order report is saved in the visitor's browser before it is sent and
  removed once the platform has it. If the visitor leaves before it is sent, the assistant sends it
  the next time it loads on your site. The same order still counts once. The browser keeps at most
  **10 unsent order reports, for at most 7 days**; when an 11th arrives, the oldest is dropped.
  When the browser blocks local storage, nothing can be saved, so the report is only attempted
  once.
- **Failures never affect your page.** Whether a failed order report is tried again depends on why
  it failed:
  - Kept and sent again later: network errors, and responses 408, 425, 429 or 5xx.
  - Dropped: the platform refused the data and the browser could read the refusal (400, 401, 403,
    404, 405, 410, 413, 415, 422). Sending the same data again would be refused again.
  - Kept until the 7 days run out: the browser could not read the response. This is what happens
    when the key is no longer valid or the page's address is not allowed. The Network tab shows
    401 or 403, but that response carries no permission for the page to read it, so to the
    assistant it looks like a network error.
  - Add-to-cart reports are not saved. If one fails, the next add-to-cart reports again.

### Check that it works

1. Open your browser's developer tools, Network tab. Click "Add to cart", then open the thank-you
   page. **The first time**, each one sends `POST …/storefront-agent/attribution` and gets **200**
   with `{"accepted": true, …}`. A repeat sends nothing: the same add-to-cart (same visitor, same
   conversation, same day) and the same order are recognised in the browser. To test an order
   again, use a new order ID.
2. Or check from the console instead of clicking: `EcommXAIWidget.track("cart_added")` returns
   `true` the first time and `false` after that, because the same visitor counts once per
   conversation per day. If you already clicked "Add to cart" in step 1, that was the first time.
   To test again, choose "New conversation" in the assistant panel.
3. In the dashboard, the impact card gains a line at the bottom: "Store add-to-cart reports since …,
   last received …" and "Order reports since …, last received …". Only dates are shown, and the
   last-received date can lag by a few minutes. The two steps switch on separately: "Added to cart"
   with the first add-to-cart report from your site, "Ordered" with the first order report.

### Common situations

| What you see | Why | What to do |
|---|---|---|
| The thank-you page is on your payment provider's domain | The install code is not on that page, and visitors are tracked per site, so the order cannot be matched to a visitor. It is counted under "orders that couldn't be matched to a visitor". | Report from the page on **your** domain that the buyer returns to. |
| The visitor's browser blocks local storage (a privacy setting or an extension) | The visitor cannot be identified. | Nothing. Add-to-cart is not counted; the order is reported but not matched to a visitor. |
| Every request gets 200, but the card still says "not connected yet" | The events are being sent by your own code straight to the endpoint instead of through the two lines above. | Use `EcommXAIWidgetQueue` or `EcommXAIWidget.track()`. Do not build the request yourself. |
| The Network tab shows 401 or 403 | The key is no longer valid, or your site's address is not in the allowed list. | Check the allowed addresses in the dashboard; regenerate the key if needed. |
| You only tested, and now want the card back to "not connected yet" | Once connected, the card does not switch back by itself. | Contact us and we will reset it. |

## Limits to know about

- Events are reported by the visitor's browser. Treat the numbers as observations of what happened
  on your site, not as accounting records.
- A report waits in the queue until the assistant has loaded. If the visitor leaves the page before
  that, the report is lost. Resending covers order reports the assistant has already picked up.
- To count visitors, the assistant keeps a random identifier in the visitor's browser (local
  storage) for 7 days. It is not tied to who the visitor is. Check what your own privacy notice
  needs to say about it. How long conversations and these reports are kept is the "Keep
  conversations for (days)" setting in your dashboard.
- Use one assistant key per page.
- Visitors are counted per site address. A visitor who moves between `shop.example.com` and
  `checkout.example.com` is counted as two.
