# Website AI assistant on a custom site — runnable example

Two static pages that show the whole front-end integration described in
[Website AI assistant on your own site](../../docs/platforms/custom-rest/storefront-widget.md)
([繁體中文](../../docs/zh/storefront-widget.md)):

| File | What it shows |
|---|---|
| [`index.html`](index.html) | A product page: the install code, the optional cart bridge, and **report line 1** (add-to-cart) |
| [`thank-you.html`](thank-you.html) | The page after checkout: the install code and **report line 2** (order placed) |
| [`assets/config.js`](assets/config.js) | The three values from your install code — the only file you edit |
| [`assets/install.js`](assets/install.js) | Loads the assistant for the demo. Your real site pastes the install code instead |
| [`assets/demo-cart.js`](assets/demo-cart.js) | A stand-in for **your** cart API, kept in the browser so the demo needs no server |
| [`assets/site.css`](assets/site.css) | Looks only. Nothing in the integration depends on it |

No build step, no dependencies.

## Run it

1. In the EcommX AI dashboard, open **Agentic AI → Agent Endpoint → Website AI Agent**. Add the
   address you will open the demo from to the allowed addresses, then create a key and copy the
   install code.
   - Production keys accept only `https://` addresses. Put these files on an `https://` address you
     control (a staging site, or an HTTPS tunnel to your machine) and allow that address.
   - A test environment may also accept `http://localhost:8080`. If the dashboard refuses the
     address, it does not.
2. Put the three values from the install code into [`assets/config.js`](assets/config.js):

   | Install code attribute | `config.js` |
   |---|---|
   | `src` | `widgetSrc` |
   | `data-widget-key` | `widgetKey` |
   | `data-api-base` | `apiBase` |

3. Serve the folder and open it:

   ```bash
   cd examples/storefront-widget-custom-site
   python3 -m http.server 8080
   ```

   Then open `http://localhost:8080/` (or the HTTPS address you deployed to).

   The demo reads the three values from `assets/config.js` only. It never takes them from the page
   address, so a link cannot choose which script the page loads.

## Try it

1. Open your browser's developer tools, **Network** tab.
2. On the product page, choose **Add to cart**. One request goes out:
   `POST …/storefront-agent/attribution` → `200` with `{"accepted": true, …}`.
3. Choose **Check out**. The thank-you page sends a second request of the same kind for the order.
4. Reload the thank-you page. Nothing new is counted: the same order ID counts once.
5. In the dashboard, open **Agentic AI → Agent to Agent → Insights**. The AI assistant impact card
   shows the "Added to cart" and "Ordered" steps, and a line at the bottom says since when your site
   has been reporting.

If the chat bubble does not appear, or the requests get `401` or `403`, the page address does not
match an allowed address exactly (scheme, host and port), or the key was regenerated.

## Using it in your own site

Copy the two report calls and adapt what surrounds them:

- Replace every `demoCart` call with a request to your own cart API.
- Call the add-to-cart report **after** your cart API succeeded, not on click.
- On the thank-you page, take `order_id` and the lines from the order your server rendered.
- Send identifiers and status words only. Never send names, email addresses, phone numbers or
  postal addresses.
- Delete `assets/install.js` and `assets/config.js`; paste the install code from the dashboard just
  before `</body>` on every page.

The field list, limits and common situations are in the
[guide](../../docs/platforms/custom-rest/storefront-widget.md#3-report-add-to-cart-and-orders-optional).
