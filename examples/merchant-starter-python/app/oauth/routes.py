"""OAuth 2.0 Authorization Server — 4 endpoint pre-built（M8 identity linking 用）。

對齊 docs/dashboard-field-reference.md §3.7.5 + Node starter 對等實作。

4 endpoint：
  GET  /oauth/authorize         — consent UI（買家親自跳轉登入 + 同意）
  POST /oauth/authorize/decide  — consent form submit handler
  POST /oauth/token             — code 換 access_token (PKCE 驗證)
  GET  /oauth/userinfo          — access_token → member_id
  GET  /oauth/jwks              — 公開公鑰
"""

from __future__ import annotations

import os
import secrets
import time
from html import escape

import jwt
from fastapi import APIRouter, Form, Header, HTTPException, Request, status
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse

from .jwt_signer import public_jwk, sign_access_token, verify_access_token
from .pkce import verify_pkce
from .store import CodeEntry, authenticate_member, consume_code, put_code

router = APIRouter(prefix="/oauth")

_CLIENT_ID = os.getenv("OAUTH_CLIENT_ID", "client_ecommxai_demo")
_CLIENT_SECRET = os.getenv("OAUTH_CLIENT_SECRET", "demo-secret")
_ISSUER = os.getenv("OAUTH_ISSUER", "http://localhost:3000")
_CODE_TTL_SEC = 10 * 60


@router.get("/authorize", response_class=HTMLResponse)
def authorize(
    response_type: str,
    client_id: str,
    redirect_uri: str,
    code_challenge: str,
    code_challenge_method: str,
    scope: str = "",
    state: str = "",
    locale: str = "zh-TW",
) -> HTMLResponse:
    """Consent UI — 買家親自登入 + 同意。"""
    if response_type != "code":
        raise HTTPException(
            status_code=400,
            detail={"error": {"type": "invalid_request", "message": "response_type must be 'code'"}},
        )
    if client_id != _CLIENT_ID:
        raise HTTPException(
            status_code=400,
            detail={"error": {"type": "invalid_client", "message": "unknown client_id"}},
        )
    if code_challenge_method != "S256":
        raise HTTPException(
            status_code=400,
            detail={"error": {"type": "invalid_request", "message": "PKCE S256 required"}},
        )

    return HTMLResponse(
        _render_consent(
            locale=locale,
            redirect_uri=redirect_uri,
            state=state,
            scope=scope,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
        )
    )


@router.post("/authorize/decide")
def authorize_decide(
    decision: str = Form(...),
    redirect_uri: str = Form(...),
    state: str = Form(""),
    scope: str = Form(""),
    code_challenge: str = Form(...),
    code_challenge_method: str = Form(...),
    email: str = Form(""),
    password: str = Form(""),
) -> RedirectResponse:
    sep = "&" if "?" in redirect_uri else "?"
    if decision != "allow":
        return RedirectResponse(
            url=f"{redirect_uri}{sep}error=access_denied&state={state}",
            status_code=302,
        )

    member = authenticate_member(email, password)
    if member is None:
        raise HTTPException(
            status_code=401,
            detail={"error": {"type": "unauthorized", "message": "invalid credentials"}},
        )

    code = secrets.token_urlsafe(32)
    put_code(
        code,
        CodeEntry(
            client_id=_CLIENT_ID,
            redirect_uri=redirect_uri,
            member_id=member["id"],
            scope=scope,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
            expires_at=time.time() + _CODE_TTL_SEC,
        ),
    )
    return RedirectResponse(
        url=f"{redirect_uri}{sep}code={code}&state={state}",
        status_code=302,
    )


@router.post("/token")
def token(
    grant_type: str = Form(...),
    code: str = Form(...),
    redirect_uri: str = Form(...),
    client_id: str = Form(...),
    client_secret: str = Form(...),
    code_verifier: str = Form(...),
) -> JSONResponse:
    if grant_type != "authorization_code":
        raise HTTPException(
            status_code=400,
            detail={"error": {"type": "unsupported_grant_type", "message": "only authorization_code"}},
        )
    if client_id != _CLIENT_ID or client_secret != _CLIENT_SECRET:
        raise HTTPException(
            status_code=401,
            detail={"error": {"type": "invalid_client", "message": "client auth failed"}},
        )
    entry = consume_code(code)
    if entry is None or entry.redirect_uri != redirect_uri:
        raise HTTPException(
            status_code=400,
            detail={"error": {"type": "invalid_grant", "message": "code invalid / expired / used"}},
        )
    if not verify_pkce(code_verifier, entry.code_challenge, entry.code_challenge_method):
        raise HTTPException(
            status_code=400,
            detail={"error": {"type": "invalid_grant", "message": "PKCE verification failed"}},
        )

    access_token = sign_access_token(
        subject=entry.member_id,
        client_id=client_id,
        scope=entry.scope,
        issuer=_ISSUER,
    )
    return JSONResponse(
        {"access_token": access_token, "token_type": "Bearer", "expires_in": 3600, "scope": entry.scope}
    )


@router.get("/userinfo")
def userinfo(authorization: str = Header(default="")) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": {"type": "unauthorized", "message": "Bearer required"}},
        )
    token_str = authorization[len("Bearer ") :]
    try:
        payload = verify_access_token(token_str, client_id=_CLIENT_ID, issuer=_ISSUER)
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=401,
            detail={"error": {"type": "invalid_token", "message": str(exc)}},
        ) from exc

    return {
        "sub": payload["sub"],
        "merchant_member_id": payload["sub"],
    }


@router.get("/jwks")
def jwks() -> dict:
    """Public key set — Gateway 用此驗 JWT 簽章。"""
    return {"keys": [public_jwk()]}


# ─── Consent UI rendering ─────────────────────────────────────


_COPY = {
    "zh-TW": {
        "title": "EcommX AI 想代表你綁定帳號",
        "body": (
            "EcommX AI 想代表你把 AI 通道的帳號綁定到你的 acme 會員。"
            "同意後 EcommX AI 可以在 AI 通道（ChatGPT / Gemini / Copilot 等）"
            "替你下單時帶上你的會員 ID。"
        ),
        "email": "Email",
        "password": "密碼",
        "allow": "同意綁定",
        "deny": "拒絕",
        "hint": "demo: 任何 password 皆可登入；prod 換成自家 hash compare。",
    },
    "en": {
        "title": "EcommX AI wants to link your account",
        "body": (
            "EcommX AI wants to link the AI channel account to your acme membership. "
            "Once allowed, EcommX AI can attach your member ID when AI agents place orders on your behalf."
        ),
        "email": "Email",
        "password": "Password",
        "allow": "Allow link",
        "deny": "Deny",
        "hint": "demo: any password works; prod must use hashed comparison.",
    },
}


def _render_consent(*, locale: str, redirect_uri: str, state: str, scope: str, code_challenge: str, code_challenge_method: str) -> str:
    copy = _COPY.get(locale, _COPY["en"])
    return f"""<!doctype html>
<html lang="{escape(locale)}">
<head>
  <meta charset="utf-8">
  <title>{escape(copy["title"])}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {{ font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 4rem auto; padding: 0 1rem; line-height: 1.5; color: #1a1a1a; }}
    h1 {{ font-size: 1.25rem; }}
    p {{ color: #555; font-size: 0.9rem; }}
    label {{ display: block; margin-top: 1rem; font-size: 0.85rem; font-weight: 500; }}
    input {{ width: 100%; padding: 0.5rem; margin-top: 0.25rem; border: 1px solid #ccc; border-radius: 0.25rem; box-sizing: border-box; }}
    .actions {{ margin-top: 1.5rem; display: flex; gap: 0.5rem; }}
    button {{ flex: 1; padding: 0.6rem; border: 1px solid #ccc; border-radius: 0.25rem; cursor: pointer; font-size: 0.9rem; }}
    button[name=decision][value=allow] {{ background: #1a1a1a; color: white; border-color: #1a1a1a; }}
    .hint {{ color: #999; font-size: 0.75rem; margin-top: 1rem; }}
  </style>
</head>
<body>
  <h1>{escape(copy["title"])}</h1>
  <p>{escape(copy["body"])}</p>
  <form method="POST" action="/oauth/authorize/decide">
    <input type="hidden" name="redirect_uri" value="{escape(redirect_uri)}">
    <input type="hidden" name="state" value="{escape(state)}">
    <input type="hidden" name="scope" value="{escape(scope)}">
    <input type="hidden" name="code_challenge" value="{escape(code_challenge)}">
    <input type="hidden" name="code_challenge_method" value="{escape(code_challenge_method)}">
    <label>{escape(copy["email"])}<input type="email" name="email" required value="alice@acme.com"></label>
    <label>{escape(copy["password"])}<input type="password" name="password" required value="demo"></label>
    <div class="actions">
      <button type="submit" name="decision" value="deny">{escape(copy["deny"])}</button>
      <button type="submit" name="decision" value="allow">{escape(copy["allow"])}</button>
    </div>
    <p class="hint">{escape(copy["hint"])}</p>
  </form>
</body>
</html>"""


# Silence unused import warning when Request is included for future expansion
_ = Request
