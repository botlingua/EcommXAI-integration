# Register

Creating your EcommX AI account is the same for every platform — only the **connect** step (step 5)
branches. If you haven't picked a path yet, see [Choose your platform](../00-choose-your-platform.md).

## Sign-up wizard

Go to **https://signup.ecommxai.com** and create an account: work email, business name, and your
platform (Shopify / WooCommerce / Custom). You go **straight into the wizard** — no need to wait for
the verification email first (but you do need it before agents can reach you — see
[Verify your email](#verify-your-email) below). The wizard walks you through:

1. **Pick your subdomain** — e.g. `acme` → your store lives at `acme.ecommxai.com` (you can switch to
   your own domain later — see [Your domain](your-domain.md)). 3–32 chars; lowercase letters / digits /
   hyphen; starts with a letter. The name is checked live and locked for 5 minutes so nobody grabs it.
2. **Business card** — name, one-line description, categories. AI agents use this to introduce your store.
3. **AI adaptation** — opt in (recommended) or skip; enable it later if you prefer.
4. **Model tier** — pick *lite / standard / advanced*. You don't bring your own LLM key.
5. **Connect your platform** — this branches by platform:
   - **Shopify** → [connect guide](../platforms/shopify/connect.md)
   - **WooCommerce** → [connect guide](../platforms/woocommerce/connect.md)
   - **Custom REST** → [connect guide](../platforms/custom-rest/connect.md)

   You can also **skip** this step and connect later from the dashboard.
6. **Review & finish** — confirm and go live.

After you finish, you land in your dashboard. Next: connect your platform (if you skipped) and then
[go live](go-live.md).

## Verify your email

Verification is **not** a gate on signing up or finishing the wizard — but it **is** a gate on being
reachable. Until you click the link in the verification email:

- Your agent-facing endpoints return **HTTP 503** — that includes
  `https://<your-subdomain>.ecommxai.com/.well-known/agent-card.json` and the A2A / ACP / UCP
  endpoints. Your store is set up, but no AI agent can talk to it yet.
- Your free AI credit stays locked.

The email goes to the address you signed up with. Can't find it? Use the **resend** button in the
banner at the top of the dashboard. Once verified, the endpoints start serving immediately — nothing
else to re-run.

> If you're building against the API and every agent-facing request returns 503, check this first —
> an unverified email produces exactly that, by design, and it is not a problem with your integration.
