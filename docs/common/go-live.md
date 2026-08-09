# Go live

You've connected your platform. The finish line is the same for everyone.

## Test the connection

In **Commerce → Connection**, click **Test connection** → expect green (HTTP 200 + latency). Once
green, catalog sync starts automatically and AI agents can discover your products.

Watch **Recent errors** for any outbound issues — they're shown in plain language (e.g. "couldn't
reach your store"), not raw stack traces.

## Verify your email — required before agents can reach you

Connection green is not the last gate. Until the email you signed up with is verified, every
agent-facing endpoint returns **HTTP 503** — `.well-known/agent-card.json` and the A2A / ACP / UCP
endpoints included. Click the link in the verification email (or use the **resend** button in the
dashboard banner); serving starts immediately after, with nothing to re-run.

Verifying also unlocks your free AI credit.

## Production tips

- **HTTPS** — required in production. (Shopify / WooCommerce are HTTPS already; for custom REST, use
  HTTPS in production.)
- **Custom REST timeout** — set a per-request timeout you can meet (default 30s; configurable 5–60s).
- **Your store address** — a free `*.ecommxai.com` subdomain, or [your own domain](your-domain.md).

That's it — connection green + email verified + sync running = you're discoverable by AI agents. 🎉
