# Error handling

## Error envelope

Return errors in a consistent shape:

```json
{
  "error": {
    "type": "<machine-readable-code>",
    "message": "<human-readable explanation>",
    "details": { }
  }
}
```

## Common types

| `type` | HTTP | When |
|---|---|---|
| `unauthorized` | 401 | Missing or invalid Bearer token. |
| `not_found` | 404 | Resource (e.g. a product id) not found. |
| `invalid_request` | 400 | Bad payload — missing param, too many SKUs, etc. |
| `conflict` | 409 | Idempotency mismatch or business-rule violation (checkout). |
| `internal_error` | 500 | Your side failed. |

## HTTP status, how the platform reacts

- **2xx** — success.
- **4xx** — your side can resolve it (auth, payload, business rule). Not retried.
- **5xx** — your internal error. The platform may retry and, on repeated failures, mark the
  connection unhealthy (visible in your dashboard).
- **Timeout** — default 30s (configurable 5–60s in the dashboard). Treated like a connection failure.

## Notes

- `GET /products` / `GET /categories` returning **404** is treated as a fatal misconfiguration
  (wrong Base URL), not as "empty catalog". Return `200` with an empty `items: []` if you genuinely
  have nothing.
- Malformed success bodies (e.g. a variant missing `price`) are rejected by the platform as a
  response-shape error — validate your output against [the OpenAPI spec](../../../openapi/custom-rest.v1.yaml).

**Next:** [Webhooks & checkout](webhooks-and-checkout.md) · [FAQ](faq.md).
