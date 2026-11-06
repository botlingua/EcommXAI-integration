# Shopify — connect

**No code to write.** EcommX AI talks to Shopify for you — you create an Admin API token in Shopify
and paste it during onboarding (or later in the dashboard).

## 1. Create an app + token in Shopify

1. Shopify Admin → **Settings → Apps and sales channels → Develop apps**.
2. **Create an app** (name it e.g. "EcommX AI").
3. **Configuration → Admin API access scopes** — enable these:
   - `read_products`
   - `read_inventory`
   - `read_orders`
   - `write_draft_orders`

   Save.
4. **API credentials → Install app**, then under **Admin API access token** click **Reveal token
   once** and copy it (it starts with `shpat_`).

## 2. Paste it in EcommX AI

In the wizard's connect step (or **Commerce → Connection**), enter:

- **Shopify store URL** — `https://your-shop.myshopify.com`
- **Admin API access token** — the `shpat_…` token

Click **Verify connection** — we test it immediately, then you're connected.

## Managing it later

In **Commerce → Connection** you can rotate the token: generate a new one in Shopify, paste it, **Save**,
and confirm **Replace existing credential** — the old token stops working immediately. The webhook
signing secret is managed automatically; you don't set it.

Next: [go live](../../common/go-live.md).
