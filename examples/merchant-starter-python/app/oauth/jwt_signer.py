"""JWT signing (RS256) — 商家自家 private key 簽 access_token。

Dev：啟動時 generate 一組 RSA key pair（每次重啟換新；prod 換成 PEM file）。
"""

from __future__ import annotations

import time

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

_PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_KID = "starter-key-1"


def _public_key_jwk() -> dict:
    """匯出 public key 為 JWK 格式（給 Gateway 驗 JWT 用）。"""
    pub = _PRIVATE_KEY.public_key()
    numbers = pub.public_numbers()
    import base64 as _b64

    def _int_to_b64url(value: int) -> str:
        length = (value.bit_length() + 7) // 8
        return _b64.urlsafe_b64encode(value.to_bytes(length, "big")).rstrip(b"=").decode()

    return {
        "kty": "RSA",
        "n": _int_to_b64url(numbers.n),
        "e": _int_to_b64url(numbers.e),
        "kid": _KID,
        "use": "sig",
        "alg": "RS256",
    }


def sign_access_token(*, subject: str, client_id: str, scope: str, issuer: str, ttl_sec: int = 3600) -> str:
    """簽一個 access_token（RS256）；payload 帶 sub / aud / iss / iat / exp / scope。"""
    now = int(time.time())
    pem = _PRIVATE_KEY.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return jwt.encode(
        {
            "sub": subject,
            "iss": issuer,
            "aud": client_id,
            "iat": now,
            "exp": now + ttl_sec,
            "scope": scope,
        },
        pem,
        algorithm="RS256",
        headers={"kid": _KID},
    )


def verify_access_token(token: str, *, client_id: str, issuer: str) -> dict:
    """驗 JWT 簽章 + 必要 claims；失敗 raise InvalidTokenError。"""
    pub_pem = _PRIVATE_KEY.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return jwt.decode(
        token,
        pub_pem,
        algorithms=["RS256"],
        audience=client_id,
        issuer=issuer,
    )


def public_jwk() -> dict:
    """For /oauth/jwks endpoint。"""
    return _public_key_jwk()
