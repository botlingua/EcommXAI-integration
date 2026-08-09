# Overview

You picked **custom REST** integration — your store runs on your own system (not Shopify or
WooCommerce), so there's no off-the-shelf adapter. Instead you expose **one Base URL + one Bearer
token**, and the EcommX AI Gateway calls a fixed set of paths under that Base URL.

## Mental model

```
[ buyer via an AI agent ]
          │
          ▼
┌────────────────────┐         Your store's REST API
│  EcommX AI Gateway │ ──────► (Base URL, e.g. https://api.acme.com/v1)
│  (custom REST)     │         │  Bearer token auth
└────────────────────┘         ▼
          │              ┌────────────────────┐
          │              │ Day-1: 5 endpoints │ ← required
          │              │ Optional: checkout │ ← when you opt in
          │              └────────────────────┘
          ▼
[ your members / fulfillment / payments — your own system, unchanged ]
```

- **Credential direction is always merchant → platform.** You generate the Bearer token and
  configure it in the dashboard. The platform never issues you a token.
- **Paths are fixed (convention over configuration).** You provide one Base URL; the Gateway calls
  `<base>/products`, `<base>/categories`, etc. You don't register each endpoint.

## What you'll do

1. **Implement 5 day-1 endpoints** — or fork a [starter](../../../examples/) and swap the data source.
2. **Register on EcommX AI**, pick a subdomain, generate your Bearer token.
3. **Connect** — set Base URL + token in the dashboard, test the connection, go live.

## Day-1 vs optional

| Scope | Endpoints |
|---|---|
| **Day-1 (required)** | `GET /health`, `GET /products`, `GET /products/{id}`, `GET /categories`, `GET /inventory` |
| **Optional (planned)** | `POST /checkout/*` — only when you enable checkout (see [doc 8](webhooks-and-checkout.md)) |
| **Webhooks** (you → Gateway) | Optional real-time catalog updates (see [doc 8](webhooks-and-checkout.md)) |

The full machine-readable contract is [`openapi/custom-rest.v1.yaml`](../../../openapi/custom-rest.v1.yaml).

**Next:** [Register & get your key](../../common/register.md) — or jump to
[Quickstart](quickstart.md) to run a starter first.
