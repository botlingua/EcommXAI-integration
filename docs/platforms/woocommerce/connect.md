# WooCommerce — connect

**No code to write.** EcommX AI talks to WooCommerce for you — you create a REST API key pair in
WooCommerce and paste it during onboarding (or later in the dashboard).

## 1. Create REST API keys in WooCommerce

1. WordPress Admin → **WooCommerce → Settings → Advanced → REST API**.
2. **Add key** — name it e.g. "EcommX AI", pick an admin user.
3. **Permissions: Read/Write** (required — we create draft orders for checkout). **Generate API key**.
4. Copy **both** values now (the secret is shown once):
   - **Consumer key** (`ck_…`)
   - **Consumer secret** (`cs_…`)

## 2. Paste it in EcommX AI

In the wizard's connect step (or **Commerce → Connection**), enter:

- **Site URL** — your store URL, e.g. `https://shop.example.com` (no trailing slash). We build the
  REST base `…/wp-json/wc/v3` for you.
- **Consumer key** — the `ck_…` value
- **Consumer secret** — the `cs_…` value

Click **Verify connection** — we test it immediately, then you're connected.

## Managing it later

In **Commerce → Connection** you can rotate the keys. The WooCommerce key + secret are a **pair** —
update **both** at once (generate a fresh pair in WooCommerce, paste both, **Save**, confirm). Updating
only one is rejected.

Next: [go live](../../common/go-live.md).
