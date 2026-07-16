# EcommX AI — eCommerce Integration

Connect your online store to **EcommX AI** so AI agents and AI shopping assistants can discover your
products, check inventory, and complete checkout. **You don't change your storefront.**

How you connect depends on what your store runs on:

| Your store runs on… | What you do | Guide |
|---|---|---|
| **Shopify** | Connect with an Admin API token — **no code** | [docs/platforms/shopify](docs/platforms/shopify/connect.md) |
| **WooCommerce** | Connect with a REST API key pair — **no code** | [docs/platforms/woocommerce](docs/platforms/woocommerce/connect.md) |
| **Your own / in-house system** | Implement 5 small REST endpoints (or fork a starter) | [docs/platforms/custom-rest](docs/platforms/custom-rest/overview.md) |

→ **Start at [Choose your platform](docs/00-choose-your-platform.md).**

> Building the **custom REST** integration with an AI tool (Claude Code, …)? See [`AGENTS.md`](AGENTS.md)
> and [`openapi/custom-rest.v1.yaml`](openapi/custom-rest.v1.yaml).

## The journey (every platform)

1. **[Register](docs/common/register.md)** — create your account and pick your store address.
2. **Connect** — the platform-specific step above (Shopify/Woo = a setting; custom = your API).
3. **[Go live](docs/common/go-live.md)** — test the connection; AI agents can discover you.

Your store gets an address — `your-shop.ecommxai.com` by default, or
[**your own domain**](docs/common/your-domain.md) like `agent.yourshop.com`.

## Repository layout

| Path | What |
|---|---|
| [`docs/00-choose-your-platform.md`](docs/00-choose-your-platform.md) | Start here — pick your path |
| [`docs/common/`](docs/common/) | Register · your domain · go-live (all platforms) |
| [`docs/platforms/`](docs/platforms/) | Per-platform connect guides (custom-rest / shopify / woocommerce) |
| [`docs/architecture/`](docs/architecture/) | Platform deployment decisions for maintainers |
| [`openapi/`](openapi/) | Machine-readable contract — **custom REST only** |
| [`examples/`](examples/) | Runnable Node + Python starters — **custom REST only** |
| [`AGENTS.md`](AGENTS.md) · [`llms.txt`](llms.txt) | For AI coding agents (custom REST) |

## Support & license

- Integration questions / starter bugs → open a GitHub issue.
- Security reports → [`SECURITY.md`](SECURITY.md) (private disclosure).
- Licensed under [Apache-2.0](LICENSE).
