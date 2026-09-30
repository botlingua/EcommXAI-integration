# Your domain

Your store gets a web address that AI agents use to reach your catalog.

## Default: a free subdomain

When you register, you pick a **subdomain** (wizard step 1): a slug like `acme` gives you
**`acme.ecommxai.com`**. It goes live when you finish onboarding and is the default address for AI
agents. (The slug can't be changed afterwards — contact support if you must.)

## Optional: use your own domain

Prefer agents to reach you at your own domain, e.g. **`agent.yourshop.com`**? Set a **custom domain**
in **Commerce → Custom Domain**.

### 1. Choose a mode

- **Let EcommX AI handle it** (recommended) — works with any DNS provider (GoDaddy, Namecheap, …).
  You add two DNS records; we issue the TLS certificate.
- **Use your own Cloudflare** (advanced) — if you already manage this domain in Cloudflare.

### 2. Enter your address

- **Prefix** — e.g. `agent` (3–32 chars; lowercase letters / digits / hyphen; starts with a letter).
- **Domain** — a domain **you own**, e.g. `yourshop.com`.
- Preview: `agent.yourshop.com`. Click **Generate setup steps**.

### 3. Add two DNS records at your DNS provider

We show you the exact values; add both records where you manage DNS:

| Type | Name / Host | Value |
|---|---|---|
| **TXT** | `_ecommxai-challenge.agent.yourshop.com` | the verification token we show you — proves you own the domain |
| **CNAME** | `agent.yourshop.com` | the target we show you — points the name to our servers |

*(Cloudflare mode only:* turn the CNAME's **proxy on** (orange cloud) and set SSL/TLS to **Full**.)

### 4. Verify

Back in **Commerce → Custom Domain**, click **I've set it up, check**. We look up your DNS; once the
TXT record is visible, your domain goes **Active** — agents now reach you at `agent.yourshop.com`.

DNS can take 5–15 minutes to propagate. If it can't see the record yet, wait a few minutes and retry,
and double-check the record's Name/Value match exactly. No API keys are involved — you only edit DNS;
we manage the certificate.
