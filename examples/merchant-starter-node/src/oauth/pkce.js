/**
 * PKCE S256 驗證 — RFC 7636。
 */

const crypto = require("crypto");

function verifyPkce(codeVerifier, codeChallenge, method) {
  if (method !== "S256") return false;
  const hashed = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return hashed === codeChallenge;
}

module.exports = { verifyPkce };
