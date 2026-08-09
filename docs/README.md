# Docs

Start at **[Choose your platform](00-choose-your-platform.md)** — how you connect depends on what your
store runs on. English here; 繁體中文 (custom REST) in [`zh/`](zh/).

## Common (all platforms)

- [Register](common/register.md) — account + your store address.
- [Your domain](common/your-domain.md) — `*.ecommxai.com` subdomain, or your own domain via DNS.
- [Go live](common/go-live.md) — test the connection and you're discoverable.

## By platform

- **Shopify** — [connect](platforms/shopify/connect.md) (no code).
- **WooCommerce** — [connect](platforms/woocommerce/connect.md) (no code).
- **Custom REST** —
  [overview](platforms/custom-rest/overview.md) ·
  [quickstart](platforms/custom-rest/quickstart.md) ·
  [connect](platforms/custom-rest/connect.md) ·
  [API reference](platforms/custom-rest/api-reference.md) ·
  [data model](platforms/custom-rest/data-model.md) ·
  [errors](platforms/custom-rest/error-handling.md) ·
  [webhooks & checkout](platforms/custom-rest/webhooks-and-checkout.md) ·
  [FAQ](platforms/custom-rest/faq.md).

The machine-readable contract (custom REST) is [`../openapi/custom-rest.v1.yaml`](../openapi/custom-rest.v1.yaml).
Building the custom REST integration with an AI tool? See [`../AGENTS.md`](../AGENTS.md).
