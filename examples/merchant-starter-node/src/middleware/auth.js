/**
 * Bearer token 驗證 middleware。
 *
 * 對齊 docs/integration/custom-rest.md §5。
 * MERCHANT_BEARER env 設你發給 EcommX AI 的 token；request 必帶 Authorization: Bearer <token>。
 */

const EXPECTED = process.env.MERCHANT_BEARER || "dev-bearer-replace-me";

function requireBearer(req, res, next) {
  const header = req.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/);
  if (!match || match[1] !== EXPECTED) {
    return res.status(401).json({
      error: { type: "unauthorized", message: "missing or invalid bearer token" },
    });
  }
  next();
}

module.exports = { requireBearer };
