# `ecommxai-merchant-starter-python`

> EcommX AI 商家整合 starter — Python / FastAPI。
>
> 對齊 [`docs/product/integration/custom-rest.md`](../../docs/product/integration/custom-rest.md)。

3 分鐘從 git clone 到 5 個 commerce endpoint 全可呼叫；額外 4 個 OAuth Authorization Server endpoint 為 M8 identity linking 預備。

---

## 快速開始（3 分鐘）

```bash
# 1. clone repo
git clone https://github.com/botlingua/EcommXAI-integration.git
cd EcommXAI-integration/examples/merchant-starter-python

# 2. 起 commerce-only module（Day-1 必須 5 endpoint）
docker compose -f docker-compose.commerce.yml up --build

# 3. 在另一個 terminal 跑 smoke test
export BEARER="dev-bearer-replace-me"

# /health 不需要 auth
curl -s http://localhost:3000/health

# 5 day-1 endpoint
curl -sH "Authorization: Bearer $BEARER" "http://localhost:3000/products?limit=2"
curl -sH "Authorization: Bearer $BEARER" http://localhost:3000/products/p_001
curl -sH "Authorization: Bearer $BEARER" http://localhost:3000/categories
curl -sH "Authorization: Bearer $BEARER" "http://localhost:3000/inventory?skus=TENT-2P-GREEN,STOVE-MSR"
```

全部回 200 + 預期 JSON shape → 完成 Day-1 整合。

---

## 模組對照

| Compose file | MODULE 環境變數 | 包含 endpoint |
|---|---|---|
| `docker-compose.commerce.yml` | `commerce`（預設）| 5 day-1 + /health |
| `docker-compose.full.yml` | `full` | 上面 + 4 個 OAuth AS endpoint |

`commerce` 是 onboarding day-1 必須；`full` 是 M8 identity linking 啟用時補。可分階段做：先 ship commerce，等 Gateway M8 通知再加 OAuth module。

---

## OAuth Authorization Server（Module B）— M8 identity linking 用

```bash
docker compose -f docker-compose.full.yml up --build

# 開瀏覽器試 consent UI
open "http://localhost:3000/oauth/authorize?response_type=code&client_id=client_ecommxai_demo&redirect_uri=http://localhost:9999/callback&scope=ucp:scopes:checkout_session&state=demo-state&code_challenge=YOUR_CHALLENGE&code_challenge_method=S256"
```

generate PKCE challenge 範例（Python 一行）：
```python
import secrets, hashlib, base64
v = secrets.token_urlsafe(64)
c = base64.urlsafe_b64encode(hashlib.sha256(v.encode()).digest()).rstrip(b"=").decode()
print(f"verifier={v}\nchallenge={c}")
```

完整 OAuth flow（authorize → token → userinfo）見 `app/oauth/routes.py`。

OpenAPI / Swagger UI 自動生成：開啟 `http://localhost:3000/docs` 可互動測試所有 endpoint。

---

## 接到你的會員系統

1. **`app/auth.py`** — 換成你的 Bearer 驗證邏輯（從 KMS / Vault 拿 token 比對）
2. **`app/commerce/data.py`** — 改成自家 DB query（products / categories / inventory 對齊 §3 shape）
3. **`app/oauth/store.py`** — `authenticate_member()` 換成自家 user table hash compare；`_MEMBERS` 換 DB
4. **`app/oauth/jwt_signer.py`** — `rsa.generate_private_key` 換成從 PEM file 載；**勿** 每次重啟 rotate（會讓所有舊 access_token 失效）
5. **`app/oauth/routes.py`** — `_CLIENT_ID` / `_CLIENT_SECRET` 換成自家 OAuth client 註冊表

---

## 整合 checklist（對齊 docs §11）

- [ ] `GET /health` 回 200 + `{"status":"ok"}`
- [ ] Auth：不帶 token → 401；錯誤 token → 401；正確 token → 200
- [ ] `GET /products` 回 `items[] + next_cursor`
- [ ] `GET /inventory?skus=X,Y` 批量回 `available`
- [ ] `GET /categories` 回 tree（`parent_id` 自參照）
- [ ] *（OAuth）* consent UI → code → token → userinfo 全程通過
- [ ] *（OAuth）* `GET /oauth/jwks` 公開公鑰（Gateway 用此驗 JWT）

---

## 部署建議

prod 上線前必改：

- [ ] `MERCHANT_BEARER` 換成 KMS-managed secret（不 hardcode env）
- [ ] `OAUTH_CLIENT_SECRET` 同上（never commit plaintext secrets）
- [ ] OAuth RSA private key 從 PEM file 載入（用 `serialization.load_pem_private_key`）；勿每次重啟 rotate
- [ ] `OAUTH_ISSUER` 改成 prod domain (`https://api.acme.com`)
- [ ] 在 prod 反向代理（nginx / Caddy / Cloudflare）上掛 TLS cert
- [ ] Authorization code store 改 Redis（in-memory 跨 worker 不共享）
- [ ] consent UI 加自家 brand（logo / colors / privacy policy link）

---

## License

MIT — 對齊 [`examples/MAINTENANCE.md`](../MAINTENANCE.md)。fork 自行修改不必通知。
