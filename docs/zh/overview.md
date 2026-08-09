# 總覽

你選了 **custom REST** 整合——你的商店跑在自家系統（不是 Shopify / WooCommerce），所以沒有現成
adapter。你只要對外提供 **一個 Base URL + 一個 Bearer token**，EcommX AI Gateway 就會用固定路徑
呼叫你的 API。

## Mental model

```
[ 買家透過 AI agent ]
          │
          ▼
┌────────────────────┐         你的商店 REST API
│  EcommX AI Gateway │ ──────► (Base URL，例 https://api.acme.com/v1)
│  (custom REST)     │         │  Bearer token 驗證
└────────────────────┘         ▼
          │              ┌────────────────────┐
          │              │ Day-1：5 個 endpoint│ ← 必須
          │              │ 選配：checkout      │ ← 想做才加
          │              └────────────────────┘
          ▼
[ 你的會員 / 出貨 / 金流 —— 自家系統，不用動 ]
```

- **Credential 方向永遠是商家 → 平台**：你產生 Bearer token，填進 dashboard。平台**不會**發 token 給你。
- **路徑由平台固定（convention over configuration）**：你只給一個 Base URL；平台呼叫 `<base>/products`、
  `<base>/categories` 等固定路徑，你不用逐一註冊。

## 你要做的事

1. **實作 5 個 day-1 endpoint** —— 或 fork 一份 [starter](../../examples/) 換掉資料來源。
2. **註冊 EcommX AI**、選 subdomain、產生 Bearer token。
3. **接線** —— 在 dashboard 填 Base URL + token、測連線、上線。

## Day-1 vs 選配

| 範圍 | Endpoint |
|---|---|
| **Day-1（必須）** | `GET /health`、`GET /products`、`GET /products/{id}`、`GET /categories`、`GET /inventory` |
| **選配（planned）** | `POST /checkout/*` —— 想接管 checkout 才做（見 [doc 8](../platforms/custom-rest/webhooks-and-checkout.md)） |
| **Webhook**（你 → Gateway） | 選配的即時 catalog 更新（見 [doc 8](../platforms/custom-rest/webhooks-and-checkout.md)） |

完整機器可讀契約：[`openapi/custom-rest.v1.yaml`](../../openapi/custom-rest.v1.yaml)。

**下一步：** [註冊與取得 key](register.md)，或先看 [快速開始](quickstart.md) 跑 starter。
