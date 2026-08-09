"""In-memory authorization code + 假會員 DB。

Prod 換成 Redis（code 短效 10 分鐘；一次性）+ 自家 user table（hash compare）。
"""

from __future__ import annotations

import time
from dataclasses import dataclass

CODE_TTL_SEC = 10 * 60


@dataclass
class CodeEntry:
    client_id: str
    redirect_uri: str
    member_id: str
    scope: str
    code_challenge: str
    code_challenge_method: str
    expires_at: float


_codes: dict[str, CodeEntry] = {}


def put_code(code: str, entry: CodeEntry) -> None:
    _codes[code] = entry


def consume_code(code: str) -> CodeEntry | None:
    entry = _codes.pop(code, None)
    if entry is None or time.time() > entry.expires_at:
        return None
    return entry


_MEMBERS: dict[str, dict] = {
    "alice@acme.com": {"id": "mbr_1234", "name": "Alice", "email": "alice@acme.com"},
    "bob@acme.com": {"id": "mbr_5678", "name": "Bob", "email": "bob@acme.com"},
}


def authenticate_member(email: str, password: str) -> dict | None:
    """Demo: 任何 password 皆通過；prod 必走 hash compare。"""
    if not email or not password:
        return None
    return _MEMBERS.get(email)
