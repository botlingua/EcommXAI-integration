"""PKCE S256 verification — RFC 7636。"""

from __future__ import annotations

import base64
import hashlib


def verify_pkce(code_verifier: str, code_challenge: str, method: str) -> bool:
    """Compute base64url(sha256(verifier)) 是否等於 challenge。"""
    if method != "S256":
        return False
    digest = hashlib.sha256(code_verifier.encode()).digest()
    expected = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return expected == code_challenge
