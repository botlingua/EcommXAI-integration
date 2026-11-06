# 快速開始 —— 3 分鐘跑起 starter

兩份 reference starter 完全對齊契約。Fork 一份、跑起來、再把資料來源換成你自己的。你唯一要改的是
**資料 provider** —— endpoint、auth、分頁、JSON shape 都維持不動（那是平台契約）。

## Node (Express)

```bash
git clone https://github.com/botlingua/EcommXAI-integration.git
cd EcommXAI-integration/examples/merchant-starter-node
docker compose -f docker-compose.commerce.yml up --build

# 另一個 terminal smoke test：
export BEARER="dev-bearer-replace-me"
curl -s http://localhost:3000/health
curl -sH "Authorization: Bearer $BEARER" "http://localhost:3000/products?limit=2"
curl -sH "Authorization: Bearer $BEARER" "http://localhost:3000/inventory?skus=TENT-2P-GREEN,STOVE-MSR"
```

## Python (FastAPI)

```bash
cd EcommXAI-integration/examples/merchant-starter-python
docker compose -f docker-compose.commerce.yml up --build
# 同上 curl smoke test
```

全部回 `200` + 預期 JSON → 你的 day-1 整合 shape 正確。

## 換成你的資料

打開 `src/commerce/data.js`（Node）或 `app/commerce/data.py`（Python），裡面是 **4 個 provider
function**，預設用 in-memory DEMO catalog。把每個 function 的內容換成你自家 DB / OMS 查詢 ——
**回傳 shape 保持一致**（見 [資料模型](../platforms/custom-rest/data-model.md)）：

```js
// data.js — 這 4 個換成打你的系統；契約（endpoint / auth / opaque cursor）在 routes.js（勿動）
listProducts({ offset, limit, categoryId })  // → { items, total }   （例 SELECT … LIMIT ? OFFSET ?）
getProduct(idOrSku)                           // → product | null
listCategories()                             // → [category]
getInventory(skus)                           // → { sku: availableQty }  （找不到的 sku 省略）
```

你只實作「給我第 N 頁」（`LIMIT/OFFSET`）；opaque 分頁 cursor 由 `routes.js` 編碼，你不用碰 cursor 格式。

**下一步：** [API reference](api-reference.md)、[資料模型](../platforms/custom-rest/data-model.md)；
註冊與接線看 [2](register.md) / [5](../common/go-live.md)。
