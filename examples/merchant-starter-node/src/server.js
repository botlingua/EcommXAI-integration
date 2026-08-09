/**
 * EcommX AI 商家整合 starter — Node.js entry。
 *
 * 兩個 module：
 *   MODULE=commerce → 只裝 5 day-1 commerce endpoint
 *   MODULE=full     → commerce + OAuth Authorization Server (M8 identity linking)
 *
 * 預設 commerce-only（onboarding day-1 夠用）。
 */

const express = require("express");

const commerceRoutes = require("./commerce/routes");

const app = express();
app.use(express.json({ limit: "1mb" }));

const MODULE = process.env.MODULE || "commerce";
const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

// /health 永遠掛上（無需 auth；對齊 docs/integration/custom-rest.md §3.5）
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "v1", module: MODULE });
});

// Commerce module — day-1 必須 5 endpoint
app.use("/", commerceRoutes);

if (MODULE === "full") {
  // OAuth Authorization Server — M8 identity linking
  const oauthRoutes = require("./oauth/routes");
  app.use("/oauth", oauthRoutes);
}

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  res.status(500).json({
    error: { type: "internal_error", message: err.message || "unknown" },
  });
});

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[merchant-starter-node] module=${MODULE} listening on http://${HOST}:${PORT}`,
  );
});
