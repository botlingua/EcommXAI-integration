# Quickstart — run a starter in 3 minutes

Two reference starters match the contract exactly. Fork one, run it, then swap the data source for
your own catalog. The only part you change is the **data provider** — endpoints, auth, pagination,
and JSON shapes stay as-is (that's the platform contract).

## Node (Express)

```bash
git clone https://github.com/botlingua/EcommXAI-integration.git
cd EcommXAI-integration/examples/merchant-starter-node

# start the commerce module (day-1 endpoints)
docker compose -f docker-compose.commerce.yml up --build

# in another terminal — smoke test:
export BEARER="dev-bearer-replace-me"
curl -s http://localhost:3000/health
curl -sH "Authorization: Bearer $BEARER" "http://localhost:3000/products?limit=2"
curl -sH "Authorization: Bearer $BEARER" "http://localhost:3000/categories"
curl -sH "Authorization: Bearer $BEARER" "http://localhost:3000/inventory?skus=TENT-2P-GREEN,STOVE-MSR"
```

## Python (FastAPI)

```bash
cd EcommXAI-integration/examples/merchant-starter-python
docker compose -f docker-compose.commerce.yml up --build
# same curl smoke test as above
```

All requests return `200` + the expected JSON → your day-1 integration shape is correct.

## Make it yours

Open `src/commerce/data.js` (Node) or `app/commerce/data.py` (Python). It exposes **4 provider
functions**, backed by an in-memory DEMO catalog. Replace each function's body with a query to your
real DB / OMS — **keep the return shapes** (see [Data model](data-model.md)):

```js
// data.js — implement these 4 against your system; the platform contract (endpoints,
// auth, opaque pagination cursor) stays in routes.js — DON'T touch it.
listProducts({ offset, limit, categoryId })  // → { items, total }   (e.g. SELECT … LIMIT ? OFFSET ?)
getProduct(idOrSku)                           // → product | null
listCategories()                             // → [category]
getInventory(skus)                           // → { sku: availableQty }  (omit unknown SKUs)
```

You implement "give me page N" (`LIMIT/OFFSET`); the opaque pagination cursor is encoded in
`routes.js`, so you never deal with cursor formats.

**Next:** [API reference](api-reference.md) · [Data model](data-model.md) ·
register & connect in [2](../../common/register.md) / [5](connect.md).
