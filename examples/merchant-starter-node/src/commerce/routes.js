/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  DON'T EDIT (platform contract).                                         │
 * │  Day-1 endpoints + opaque pagination cursor + JSON shapes.              │
 * │  These call the provider in data.js — change your catalog source there. │
 * └─────────────────────────────────────────────────────────────────────────┘
 * Aligned with openapi/custom-rest.v1.yaml.
 */

const express = require("express");

const { requireBearer } = require("../middleware/auth");
const provider = require("./data");

const router = express.Router();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// Opaque cursor = base64({ o: offset }). The platform round-trips it verbatim; merchants
// never see or implement it — that's why pagination lives here, not in the provider.
function encodeCursor(offset) {
  return Buffer.from(JSON.stringify({ o: offset })).toString("base64");
}
function decodeCursor(cursor) {
  if (!cursor) return 0;
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64").toString());
    return typeof decoded.o === "number" ? decoded.o : 0;
  } catch {
    return 0;
  }
}

// GET /products — paginated list (§ openapi: listProducts)
router.get("/products", requireBearer, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
    const offset = decodeCursor(req.query.cursor);
    const { items, total } = await provider.listProducts({
      offset,
      limit,
      categoryId: req.query.category_id,
    });
    const nextOffset = offset + limit;
    const next_cursor = nextOffset < total ? encodeCursor(nextOffset) : null;
    res.json({ items, next_cursor, total });
  } catch (e) {
    next(e);
  }
});

// GET /products/:id — by product id or variant SKU
router.get("/products/:id", requireBearer, async (req, res, next) => {
  try {
    const product = await provider.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: { type: "not_found", message: `id ${req.params.id} not found` },
      });
    }
    res.json(product);
  } catch (e) {
    next(e);
  }
});

// GET /categories
router.get("/categories", requireBearer, async (_req, res, next) => {
  try {
    res.json({ items: await provider.listCategories() });
  } catch (e) {
    next(e);
  }
});

// GET /inventory?skus=A,B — omit unknown SKUs
router.get("/inventory", requireBearer, async (req, res, next) => {
  try {
    const skus = (req.query.skus || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (skus.length > MAX_LIMIT) {
      return res.status(400).json({
        error: { type: "invalid_request", message: `max ${MAX_LIMIT} skus per call` },
      });
    }
    const map = await provider.getInventory(skus);
    const items = skus.filter((s) => s in map).map((s) => ({ sku: s, available: map[s] }));
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

// /health is mounted in server.js (no auth)

module.exports = router;
