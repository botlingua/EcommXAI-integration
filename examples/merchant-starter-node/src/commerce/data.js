/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  THIS IS THE FILE YOU CHANGE.                                            │
 * │  Implement the 4 functions below against your own DB / OMS.             │
 * │  Keep the return shapes (see docs/06-data-model.md). Everything else    │
 * │  — endpoints, pagination cursor, auth — lives in routes.js (DON'T edit).│
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Out of the box these use an in-memory DEMO catalog so `git clone` just runs.
 */

// ⬇⬇⬇ DEMO data — delete this block once your functions read from your system ⬇⬇⬇
const DEMO_CATEGORIES = [
  { id: "cat_outdoor", name: "Outdoor", parent_id: null },
  { id: "cat_camping", name: "Camping", parent_id: "cat_outdoor" },
  { id: "cat_tents", name: "Tents", parent_id: "cat_camping" },
  { id: "cat_cooking", name: "Cooking", parent_id: "cat_camping" },
];

const DEMO_PRODUCTS = [
  {
    id: "p_001",
    title: "Northwild 3-Season Tent",
    description: "Lightweight 2-person tent for 3-season use.",
    category_id: "cat_tents",
    vendor: "Northwild Outfitters",
    tags: ["tent", "camping", "3-season"],
    images: ["https://example.com/tent.jpg"],
    variants: [
      { sku: "TENT-2P-GREEN", title: "2-person · Green", attributes: { size: "2P", color: "green" }, price: { amount: "299.00", currency: "USD" }, inventory: 12 },
      { sku: "TENT-2P-ORANGE", title: "2-person · Orange", attributes: { size: "2P", color: "orange" }, price: { amount: "299.00", currency: "USD" }, inventory: 3 },
    ],
  },
  {
    id: "p_002",
    title: "MSR PocketRocket 2 Stove",
    description: "Compact backpacking stove.",
    category_id: "cat_cooking",
    vendor: "MSR",
    tags: ["stove", "cooking", "backpacking"],
    images: ["https://example.com/stove.jpg"],
    variants: [
      { sku: "STOVE-MSR", title: "Default", attributes: {}, price: { amount: "49.95", currency: "USD" }, inventory: 0 },
    ],
  },
];
// ⬆⬆⬆ DEMO data ⬆⬆⬆

const provider = {
  // 👇 REPLACE: return one page of products + the total count.
  //    e.g. SELECT ... FROM products [WHERE category=?] ORDER BY id LIMIT ? OFFSET ?  (+ COUNT(*))
  async listProducts({ offset, limit, categoryId }) {
    let pool = DEMO_PRODUCTS;
    if (categoryId) pool = pool.filter((p) => p.category_id === categoryId);
    return { items: pool.slice(offset, offset + limit), total: pool.length };
  },

  // 👇 REPLACE: look up one product by product id OR variant SKU; null if not found.
  async getProduct(idOrSku) {
    return (
      DEMO_PRODUCTS.find((p) => p.id === idOrSku) ??
      DEMO_PRODUCTS.find((p) => p.variants.some((v) => v.sku === idOrSku)) ??
      null
    );
  },

  // 👇 REPLACE: return all categories.
  async listCategories() {
    return DEMO_CATEGORIES;
  },

  // 👇 REPLACE: return { sku: availableQty } for the asked SKUs; omit SKUs you don't have.
  async getInventory(skus) {
    const wanted = new Set(skus);
    const out = {};
    for (const p of DEMO_PRODUCTS)
      for (const v of p.variants) if (wanted.has(v.sku)) out[v.sku] = v.inventory;
    return out;
  },
};

module.exports = provider;
