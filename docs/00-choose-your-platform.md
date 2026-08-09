# Choose your platform

How you connect to EcommX AI depends on what your store already runs on. Pick one:

| Your store runs on… | What you do | Effort | Guide |
|---|---|---|---|
| **Shopify** | Connect in a few clicks (authorize / paste an app token) — **no code** | minutes | [platforms/shopify/connect.md](platforms/shopify/connect.md) |
| **WooCommerce** | Paste a REST API key pair from your WooCommerce admin — **no code** | minutes | [platforms/woocommerce/connect.md](platforms/woocommerce/connect.md) |
| **Your own / in-house system** | Implement 5 small REST endpoints (or fork a starter) | a few hours | [platforms/custom-rest/overview.md](platforms/custom-rest/overview.md) |

## The shape of every integration

Whatever your platform, the journey is the same three beats:

1. **[Register](common/register.md)** — create your EcommX AI account and pick your store address.
2. **Connect** — the platform-specific step above (Shopify / WooCommerce = a setting; custom = your API).
3. **[Go live](common/go-live.md)** — test the connection and you're discoverable by AI agents.

Your store also gets an address — `your-shop.ecommxai.com` by default, or **your own domain**
(e.g. `agent.yourshop.com`). See [your domain](common/your-domain.md).

## Not sure which to pick?

- If your catalog lives in **Shopify or WooCommerce**, use that path — it's a **connect, not a build**.
  You don't write or host any API; EcommX AI talks to Shopify/Woo for you.
- Pick **custom REST** only if your store is a bespoke / in-house system without a Shopify or
  WooCommerce backend. That's the path that involves writing a small API (we give you runnable
  starters so it's mostly fill-in-the-blank).
