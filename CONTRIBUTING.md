# Contributing

Thanks for helping improve the EcommX AI integration starters and docs. These are **reference
implementations** to fork — not an SDK. The authoritative contract is
[`openapi/custom-rest.v1.yaml`](openapi/custom-rest.v1.yaml); the starters are its runnable examples.

## This repository is a published mirror

Everything here is generated from a private source repository and **published by force-push**. That
has two consequences worth knowing before you spend time on a change:

- **Commits pushed directly to `main` here will be overwritten** on the next publish — including
  merged pull requests. Nothing on `main` survives unless it also exists in the private source.
- **A force-push rewrites `main`'s history**, so any open pull request loses its merge base and
  GitHub closes it automatically. Your branch and its commits are not deleted, but the PR itself
  will need to be re-opened against the new `main`.

**This does not mean your PR is unwelcome — it means the merge path is different.** Open the PR as
normal; a maintainer ports the change into the private source, and it comes back here on the next
publish (which is also what makes it permanent). If a change is time-sensitive, say so in the PR
description so it isn't left waiting on the next publish cycle.

**Out of scope for this repo**: internal platform documentation — deployment topology, cloud
provider or region choices, infrastructure decisions. This repo covers the merchant-facing
integration contract only.

## PRs we welcome

- Bug fixes in a starter (auth middleware, the 5 day-1 endpoints, pagination).
- Documentation improvements (quickstart, deployment notes, clarifications).
- **New framework examples** as sibling directories — e.g. `merchant-starter-node-koa/`,
  `merchant-starter-python-flask/` — matching the same contract. (Don't swap the framework of an
  existing starter; forks depend on it.)
- New consent/UI locales; dependency bumps that keep backward compatibility.

## PRs we won't merge

- Changes to an endpoint's shape — that would break the contract. Contract changes go through the
  platform spec process first.
- Production-only features (DB drivers, Datadog/Sentry SDKs) — starters stay minimal.
- Swapping the in-memory store for Redis/Postgres — keep starters easy to run; suggest it in the
  deployment notes instead.

## Before you open a PR

- Keep the change runnable: a starter must still `git clone` → run within a few minutes.
- If you touched an endpoint, re-check it against `openapi/custom-rest.v1.yaml`.
- If you changed the OpenAPI, lint it:
  `npx @stoplight/spectral-cli lint --ruleset .spectral.yaml openapi/custom-rest.v1.yaml`.

## Security

Please report vulnerabilities privately — see [`SECURITY.md`](SECURITY.md).
