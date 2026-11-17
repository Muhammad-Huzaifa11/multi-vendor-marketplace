# Multi-Vendor Marketplace

Mini multi-vendor marketplace (Next.js App Router + Rails API + PostgreSQL) built as a take-home slice: catalog, cart, checkout, seller dashboard, with no-oversell and idempotent checkout.

## Quick start

```bash
docker compose up --build
```

- Storefront: http://localhost:3000
- API (direct): http://localhost:3001/api/up

First boot runs migrations and seeds automatically.

## Test logins

Also shown on the login page. Password for all: `password`.

| Email | Role | Store name |
|-------|------|------------|
| `buyer@example.com` | buyer | — |
| `buyer2@example.com` | buyer | — |
| `seller1@example.com` | seller | Northside Goods |
| `seller2@example.com` | seller | River Market |

Demo oversell SKUs (kept active with stock 1 on every seed): **Last Unit Headphones**, **Single Stock Tee**.


## Run tests

```bash
docker compose exec backend bundle exec rspec
```

## Architecture

- **frontend/** — Next.js (App Router, TypeScript, Bootstrap 5). Browser calls same-origin `/api/*`; Next rewrites to Rails.
- **backend/** — Rails 8 API-only, cookie sessions, PostgreSQL.
- Checkout creates **one order per seller**, stores **price snapshots**, and applies a **10% platform commission** (`floor(subtotal_cents * 0.10)`), shown on the seller order view.

## Design decisions

- **Cents, not floats** — all money is integer cents.
- **Pessimistic locks** — checkout locks product rows `ORDER BY id FOR UPDATE` inside one transaction so concurrent buyers cannot oversell or deadlock.
- **All-or-nothing checkout** — any stock shortage rolls back the whole cart (HTTP 409).
- **Client cart, server price** — cart lives in `localStorage`; checkout re-prices from locked DB rows.
- **Idempotency-Key** — stored per `(user_id, key)` with request hash; retries return the same response; same key + different body → 422. Keys do not expire in this take-home.
- **Auth** — `has_secure_password` + Rails cookie session (SameSite=Lax, HttpOnly). JSON Content-Type required on writes as a simple CSRF guard. Role checks via `require_seller!` / `require_buyer!`; data scoped to `current_user`.
- **Per-item shipping** — sellers mark line items shipped; order status is derived (`pending` / `partially_shipped` / `shipped`).
- **Archive products** — delete sets `active: false` so order history stays intact.
- **Guidelines** — kept Rails best practices (thin controllers, `CheckoutService`, validations/scopes, RSpec, Bootstrap). Skipped Devise/CanCanCan/Stimulus/Turbo as unfit for this Next.js + API brief.

## What we cut

Real payments, image upload, emails, admin, refunds, server-side carts, production multi-stage images, full product edit forms (archive/restore is supported), and “sellers can’t buy their own products” (sellers simply don’t see Add to cart).


## What we’d do next

Stripe (or similar) with webhooks, short-lived stock reservations, background jobs, rate limiting, and better observability.

## AI / process note

Scaffolding and boilerplate were accelerated with AI assistance. Checkout locking, idempotency, and the concurrency specs were reviewed and run manually — those are the pieces to walk through in a follow-up.
