# Custom REST — connect & test

You've implemented the [5 endpoints](overview.md) (or forked a [starter](quickstart.md)) and
[registered](../../common/register.md). Now connect and test.

## What you provide

Custom REST needs two things — in the wizard's connect step, or later in **Commerce → Connection**:

| Field | What to enter |
|---|---|
| **API Base URL** | Your store's API base, e.g. `https://api.acme.com/v1`. The Gateway calls `<base>/products`, `<base>/health`, etc. |
| **Bearer token** *(optional)* | The token you generated in your own backend. Leave blank **only** if your API is truly public. |

**Generate the token however you like** — hard-code it in `.env`, generate it in your admin console,
or issue it from your own OAuth / API gateway. Direction is merchant → platform; the platform never
issues you a token. It's stored as a fingerprint + last 4 chars, never the raw value.

## Auth on your side

Validate `Authorization: Bearer <token>` on every endpoint except `/health`: read the header, compare
to the token you configured, and return `401` on mismatch.

## Pre-launch checklist (5 checks)

Each maps to the dashboard **Test connection** passing:

- [ ] **Health** — `curl <base>/health` → `200 {"status":"ok"}` (no auth).
- [ ] **Auth** — no token → `401`; wrong token → `401`; correct token → `200`.
- [ ] **Products** — `GET /products` → `items[]` + `next_cursor`; each variant has `sku`, `attributes`,
  `price{amount,currency}`, `inventory`.
- [ ] **Inventory** — `GET /inventory?skus=A,B` → correct `available` per SKU.
- [ ] **Categories** — `GET /categories` → tree via `parent_id`.

Then in **Commerce → Connection**: set your **Base URL**, paste your **Bearer token**, click
**Test connection**. Green → [go live](../../common/go-live.md).
