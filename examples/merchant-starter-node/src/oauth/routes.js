/**
 * OAuth 2.0 Authorization Server — 4 endpoint pre-built（M8 identity linking 用）。
 *
 * 對齊 docs/dashboard-field-reference.md §3.7.5「為何商家當 Authorization Server」+
 * docs/principles/identity-resolution.md。
 *
 * 4 endpoint：
 *   GET  /oauth/authorize  — consent UI（買家親自跳轉登入 + 同意）
 *   POST /oauth/token      — authorization code 換 access token (PKCE 驗證)
 *   GET  /oauth/userinfo   — 用 access token 查會員 ID
 *   GET  /oauth/jwks       — 公開公鑰（讓 Gateway 驗 JWT 簽章）
 */

const express = require("express");
const crypto = require("crypto");

const { verifyPkce } = require("./pkce");
const { signAccessToken, getPublicJwk } = require("./jwt");
const { putCode, consumeCode, authenticateMember } = require("./store");

const router = express.Router();
router.use(express.urlencoded({ extended: true }));

// 預設 demo client；prod 換成自家管理的 client 註冊表
const DEMO_CLIENT = {
  client_id: process.env.OAUTH_CLIENT_ID || "client_ecommxai_demo",
  // 永不直接驗 client_secret on /authorize（confidential client 走 token endpoint）
  client_secret: process.env.OAUTH_CLIENT_SECRET || "demo-secret",
};

// GET /oauth/authorize — consent UI
router.get("/authorize", (req, res) => {
  const {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    code_challenge,
    code_challenge_method,
    locale,
  } = req.query;

  if (response_type !== "code") {
    return res.status(400).json({
      error: { type: "invalid_request", message: "response_type must be 'code'" },
    });
  }
  if (client_id !== DEMO_CLIENT.client_id) {
    return res.status(400).json({
      error: { type: "invalid_client", message: "unknown client_id" },
    });
  }
  if (!code_challenge || code_challenge_method !== "S256") {
    return res.status(400).json({
      error: { type: "invalid_request", message: "PKCE S256 required" },
    });
  }

  const lang = (locale || "zh-TW").toString();
  const copy = consentCopy(lang);

  res.type("html").send(renderConsent({
    copy,
    redirect_uri,
    state,
    scope: scope || "",
    code_challenge,
    code_challenge_method,
  }));
});

// POST /oauth/authorize/decide — 收 consent 表單，回 callback 帶 code
router.post("/authorize/decide", async (req, res) => {
  const { email, password, decision, redirect_uri, state, scope, code_challenge, code_challenge_method } = req.body;

  if (decision !== "allow") {
    return res.redirect(
      `${redirect_uri}?error=access_denied&state=${encodeURIComponent(state || "")}`,
    );
  }

  const member = authenticateMember(email, password);
  if (!member) {
    return res.status(401).type("html").send(`<p>Invalid credentials. <a href="javascript:history.back()">Back</a></p>`);
  }

  const code = crypto.randomBytes(32).toString("base64url");
  putCode(code, {
    client_id: DEMO_CLIENT.client_id,
    redirect_uri,
    member_id: member.id,
    scope,
    code_challenge,
    code_challenge_method,
  });

  const sep = redirect_uri.includes("?") ? "&" : "?";
  res.redirect(`${redirect_uri}${sep}code=${code}&state=${encodeURIComponent(state || "")}`);
});

// POST /oauth/token — code + verifier → access_token
router.post("/token", express.urlencoded({ extended: true }), async (req, res) => {
  const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier } = req.body;

  if (grant_type !== "authorization_code") {
    return res.status(400).json({
      error: { type: "unsupported_grant_type", message: "only authorization_code supported" },
    });
  }
  if (client_id !== DEMO_CLIENT.client_id || client_secret !== DEMO_CLIENT.client_secret) {
    return res.status(401).json({
      error: { type: "invalid_client", message: "client auth failed" },
    });
  }

  const entry = consumeCode(code);
  if (!entry) {
    return res.status(400).json({
      error: { type: "invalid_grant", message: "code expired or already used" },
    });
  }
  if (entry.redirect_uri !== redirect_uri) {
    return res.status(400).json({
      error: { type: "invalid_grant", message: "redirect_uri mismatch" },
    });
  }
  if (!verifyPkce(code_verifier, entry.code_challenge, entry.code_challenge_method)) {
    return res.status(400).json({
      error: { type: "invalid_grant", message: "PKCE verification failed" },
    });
  }

  const accessToken = await signAccessToken({
    subject: entry.member_id,
    clientId: client_id,
    scope: entry.scope,
  });

  res.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    scope: entry.scope,
  });
});

// GET /oauth/userinfo — Bearer access_token → member identity
router.get("/userinfo", async (req, res) => {
  const auth = req.get("Authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/);
  if (!match) {
    return res.status(401).json({ error: { type: "unauthorized", message: "Bearer required" } });
  }

  const { jwtVerify } = require("jose");
  const { generateKeyPairSync } = require("crypto");
  void generateKeyPairSync; // silence linter — jose imports its own

  try {
    const jwk = await getPublicJwk();
    const { importJWK } = require("jose");
    const key = await importJWK(jwk, "RS256");
    const { payload } = await jwtVerify(match[1], key);
    res.json({
      sub: payload.sub,
      merchant_member_id: payload.sub,
      // optional fields for Gateway to write linkage:
      email: payload.sub.includes("@") ? payload.sub : undefined,
    });
  } catch {
    res.status(401).json({ error: { type: "invalid_token", message: "JWT verify failed" } });
  }
});

// GET /oauth/jwks — public key for Gateway to verify JWT
router.get("/jwks", async (_req, res) => {
  const jwk = await getPublicJwk();
  res.json({ keys: [jwk] });
});

// ─── Consent UI rendering ──────────────────────────────────────

function consentCopy(locale) {
  const TEXT = {
    "zh-TW": {
      title: "EcommX AI 想代表你綁定帳號",
      body: "EcommX AI 想代表你把 AI 通道的帳號綁定到你的 acme 會員。同意後 EcommX AI 可以在 AI 通道（ChatGPT / Gemini / Copilot 等）替你下單時帶上你的會員 ID。",
      email: "Email",
      password: "密碼",
      allow: "同意綁定",
      deny: "拒絕",
      hint: "demo: 任何 password 皆可登入；prod 換成自家 hash compare。",
    },
    en: {
      title: "EcommX AI wants to link your account",
      body: "EcommX AI wants to link the AI channel account to your acme membership. Once allowed, EcommX AI can attach your member ID when AI agents place orders on your behalf.",
      email: "Email",
      password: "Password",
      allow: "Allow link",
      deny: "Deny",
      hint: "demo: any password works; prod must use hashed comparison.",
    },
  };
  return TEXT[locale] || TEXT["en"];
}

function renderConsent({ copy, redirect_uri, state, scope, code_challenge, code_challenge_method }) {
  return `<!doctype html>
<html lang="${copy === undefined ? "en" : "zh-TW"}">
<head>
  <meta charset="utf-8">
  <title>${copy.title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 4rem auto; padding: 0 1rem; line-height: 1.5; color: #1a1a1a; }
    h1 { font-size: 1.25rem; }
    p { color: #555; font-size: 0.9rem; }
    label { display: block; margin-top: 1rem; font-size: 0.85rem; font-weight: 500; }
    input { width: 100%; padding: 0.5rem; margin-top: 0.25rem; border: 1px solid #ccc; border-radius: 0.25rem; box-sizing: border-box; }
    .actions { margin-top: 1.5rem; display: flex; gap: 0.5rem; }
    button { flex: 1; padding: 0.6rem; border: 1px solid #ccc; border-radius: 0.25rem; cursor: pointer; font-size: 0.9rem; }
    button[name=decision][value=allow] { background: #1a1a1a; color: white; border-color: #1a1a1a; }
    .hint { color: #999; font-size: 0.75rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>${copy.title}</h1>
  <p>${copy.body}</p>
  <form method="POST" action="/oauth/authorize/decide">
    <input type="hidden" name="redirect_uri" value="${escapeHtml(redirect_uri)}">
    <input type="hidden" name="state" value="${escapeHtml(state || "")}">
    <input type="hidden" name="scope" value="${escapeHtml(scope)}">
    <input type="hidden" name="code_challenge" value="${escapeHtml(code_challenge)}">
    <input type="hidden" name="code_challenge_method" value="${escapeHtml(code_challenge_method)}">
    <label>${copy.email}<input type="email" name="email" required value="alice@acme.com"></label>
    <label>${copy.password}<input type="password" name="password" required value="demo"></label>
    <div class="actions">
      <button type="submit" name="decision" value="deny">${copy.deny}</button>
      <button type="submit" name="decision" value="allow">${copy.allow}</button>
    </div>
    <p class="hint">${copy.hint}</p>
  </form>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

module.exports = router;
