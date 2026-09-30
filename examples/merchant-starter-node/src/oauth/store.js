/**
 * In-memory authorization code store。
 *
 * Prod 換成 Redis / DB（code 短效 10 分鐘；只用一次後丟）。
 */

const CODE_TTL_MS = 10 * 60 * 1000;
const codes = new Map();

function putCode(code, payload) {
  codes.set(code, { ...payload, expires_at: Date.now() + CODE_TTL_MS });
}

function consumeCode(code) {
  const entry = codes.get(code);
  if (!entry) return null;
  codes.delete(code); // 一次性
  if (Date.now() > entry.expires_at) return null;
  return entry;
}

// 假會員 DB — 真實整合換成自家 user 查詢
const MEMBERS = {
  "alice@acme.com": { id: "mbr_1234", name: "Alice", email: "alice@acme.com" },
  "bob@acme.com": { id: "mbr_5678", name: "Bob", email: "bob@acme.com" },
};

function authenticateMember(email, password) {
  // Demo: 任何 password 皆通過；真實要 hash compare
  const user = MEMBERS[email];
  if (!user || !password) return null;
  return user;
}

module.exports = { putCode, consumeCode, authenticateMember };
