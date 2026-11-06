# 註冊與取得 key

兩種接線方式：**(A)** 在 signup wizard 裡接、或 **(B)** 之後從 dashboard 接。不論哪種，
**Bearer token 都是你自己產生 —— EcommX AI 不會發 token 給你。**

## A. Signup wizard（初次註冊）

到 **https://signup.ecommxai.com** 建帳號：工作信箱、商家名稱、平台選 **「自行開發 / 其他」**。
建完帳號**直接進 wizard**，不用等驗證信（但 agent 要能連到你之前一定要驗 —— 見下方
[驗證你的 email](#驗證你的-email)）。wizard 帶你走 6 步：

1. **選 subdomain** —— 例 `acme` → 你的店在 `acme.ecommxai.com`。（3–32 字元；小寫字母 / 數字 /
   hyphen；開頭字母。）
2. **商家身份證** —— 名稱、一句話簡介、分類。AI agent 用來認識你的店。
3. **AI 適配** —— 啟用（推薦）或略過；之後可再開。
4. **模型等級** —— 選 lite / standard / advanced。你不用自備 LLM key。
5. **連接平台** —— custom REST 這步（見下）。**可略過**，之後再接。
6. **確認完成** —— 確認後上線。

### Custom REST 連接步驟

你填兩樣東西：

| 欄位 | 填什麼 |
|---|---|
| **API Base URL** | 你的商店 API base，例 `https://api.acme.com/v1`。平台會呼叫 `<base>/products`、`<base>/health` 等。 |
| **Bearer token**（選填） | 你在自家後台產生的 token。**只有**你的 API 真的公開才留空。 |

**怎麼產生 token** —— 由你決定，怎麼方便怎麼來：

- 寫死在 `.env`（最簡單，小團隊適用），
- 在你自己的 admin console 產生，或
- 從你自己的 OAuth / API gateway 發（進階）。

按 **驗證連線** —— EcommX AI 會打 `GET <base>/health`（帶你的 token）確認連得到，然後繼續。
還沒準備好？按 **先略過**，之後從 dashboard 接。

完成後你會進 dashboard。EcommX AI 只存 token 的 **fingerprint + 末 4 碼**，不存原文。

## B. 之後從 dashboard 接

略過了第 5 步、或要輪替 token？到 **Commerce → Connection**：

- **Base URL** —— custom REST 可編輯；設定或修改 `https://api.acme.com/v1`。
- **Credentials** —— 在「更新連線憑證」貼上 Bearer token 按 **儲存**。替換 active token 立即生效。
  旁邊有「怎麼拿 API token？」說明。
- **測試連線** —— 打 `GET <base>/health`，顯示狀態 + 延遲。
- **最近錯誤** —— 最近幾筆 outbound 失敗，用人話說明。

## 驗證你的 email

驗證**不擋**你註冊、也不擋你走完 wizard —— 但它**擋「別人連得到你」**。在你點下驗證信裡的連結之前：

- 你的 agent 對接端點一律回 **HTTP 503**，包含
  `https://<你的 subdomain>.ecommxai.com/.well-known/agent-card.json` 與 A2A / ACP / UCP 端點。
  店設定好了，但還沒有任何 AI agent 連得進來。
- 免費 AI 額度也還鎖著。

驗證信寄到你註冊用的信箱。找不到的話，用後台頁面上方橫幅的**重寄**按鈕。驗證完端點立刻開始服務，
不需要重跑任何步驟。

> 如果你正在接 API、而且 agent 對接端點都回 503 —— 先檢查這一項。email 未驗證時就是會這樣，
> 那是設計如此，不是你的整合有問題。

## 接好了的判斷

**測試連線** 變綠（HTTP 200），catalog sync 就會自動開始。

**下一步：** [接線與上線](../common/go-live.md) 的完整 checklist —— 或還沒跑過 starter
就先看 [快速開始](quickstart.md)。
