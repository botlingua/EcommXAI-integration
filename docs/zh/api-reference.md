# API reference —— Day-1 endpoints

權威、機器可讀的契約是 [`openapi/custom-rest.v1.yaml`](../../openapi/custom-rest.v1.yaml)，本頁是人類
友善的對照版。實作這 5 個，AI agent 就能瀏覽你的 catalog。

除 `/health` 外都需要 `Authorization: Bearer <token>`。

---

## `GET /health`

Liveness probe。**不需 auth**。dashboard「測試連線」按鈕與平台 monitoring 都打這個。

```bash
curl -s https://api.acme.com/v1/health
# 200 → { "status": "ok", "version": "v1" }
```

回 `200` + `{"status":"ok"}` 即可，別查 DB。

---

## `GET /products`

分頁商品列表。每個 product 帶 variants；平台把每個 variant 拍平成一個以 SKU 為鍵的 catalog item。

**Query：** `limit`（預設 50，max 200）·`cursor`（opaque；上一頁的 `next_cursor`）·`category_id`（選填）

```jsonc
{
  "items": [
    {
      "id": "p_001",
      "title": "Northwild 3-Season Tent",
      "category_id": "cat_tents",
      "vendor": "Northwild Outfitters",
      "tags": ["tent", "camping"],
      "images": ["https://..."],
      "variants": [
        {
          "sku": "TENT-2P-GREEN",
          "title": "2-person · Green",
          "attributes": { "size": "2P", "color": "green" },
          "price": { "amount": "299.00", "currency": "USD" },
          "inventory": 12
        }
      ],
      "updated_at": "2026-05-10T08:00:00Z"
    }
  ],
  "next_cursor": "eyJvIjoxMDB9",
  "total": 152
}
```

每個欄位見 [資料模型](../platforms/custom-rest/data-model.md)。`next_cursor` 是 opaque；最後一頁回 `null`（不要回 `""`）。

---

## `GET /products/{id}`

用 product id **或** variant SKU 取單一商品。**選填** —— 平台可 fallback 走 `/products` + 線性
filter，但大型 catalog（10k+ SKU）強烈建議實作以加速。

```bash
curl -sH "Authorization: Bearer $TOKEN" "https://api.acme.com/v1/products/p_001"
# 404 → { "error": { "type": "not_found", "message": "id p_001 not found" } }
```

---

## `GET /categories`

所有分類。用自參照 `parent_id` 表達 tree（root → `null`）。

```json
{
  "items": [
    { "id": "cat_camping", "name": "Camping", "parent_id": null },
    { "id": "cat_tents", "name": "Tents", "parent_id": "cat_camping" }
  ]
}
```

---

## `GET /inventory`

批量庫存查詢。單次 max 200 SKU（超過平台自動分批）。

```bash
curl -sH "Authorization: Bearer $TOKEN" "https://api.acme.com/v1/inventory?skus=TENT-2P-GREEN,STOVE-MSR"
# { "items": [ { "sku": "TENT-2P-GREEN", "available": 12 }, { "sku": "STOVE-MSR", "available": 0 } ] }
```

找不到的 SKU **省略**（讓平台分辨「缺貨」`available: 0` vs「SKU 不存在」）。

---

**下一步：** [接線與上線](../common/go-live.md)、[資料模型](../platforms/custom-rest/data-model.md)、
[錯誤處理](../platforms/custom-rest/error-handling.md)。
