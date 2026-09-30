# Security Policy

## Reporting a vulnerability

**Do not open a public issue for security problems.**

If you find a security vulnerability in this repository — in the starters (auth bypass, injection,
dependency CVE) or in the documented contract — report it privately:

- Use GitHub's **private vulnerability reporting** (this repo → Security → Report a vulnerability), or
- Email the maintainers at `security@ecommxai.example`.

We aim to acknowledge within 3 business days. Critical issues in the starters (e.g. an auth bypass)
are hotfixed within 48 hours.

## Scope

- **In scope:** the example starters, the OpenAPI contract, and the docs in this repository.
- **Out of scope:** your own deployment of a forked starter, your own infrastructure, and the
  EcommX AI platform itself (report platform issues through your support channel).

## Not a vulnerability here

The starters use an in-memory store and a placeholder dev token **by design** — they are reference
code to fork, not production services. Replace the data provider and credentials before deploying.
