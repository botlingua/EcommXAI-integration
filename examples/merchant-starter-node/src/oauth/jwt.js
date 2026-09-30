/**
 * JWT signing (RS256) — 商家自家 private key 簽 access_token + id_token。
 *
 * Dev：啟動時 generate 一組 RSA key pair（每次重啟換新；prod 換成 PKCS#8 PEM file）。
 */

const { generateKeyPairSync } = require("crypto");
const { SignJWT, exportJWK } = require("jose");

// Generate key pair once at module load
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

let cachedJwk = null;
async function getPublicJwk() {
  if (cachedJwk) return cachedJwk;
  cachedJwk = await exportJWK(publicKey);
  cachedJwk.kid = "starter-key-1";
  cachedJwk.use = "sig";
  cachedJwk.alg = "RS256";
  return cachedJwk;
}

async function signAccessToken({ subject, clientId, scope }) {
  const issuer = process.env.OAUTH_ISSUER || "http://localhost:3000";
  return new SignJWT({ scope })
    .setProtectedHeader({ alg: "RS256", kid: "starter-key-1" })
    .setSubject(subject)
    .setIssuer(issuer)
    .setAudience(clientId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
}

module.exports = { signAccessToken, getPublicJwk };
