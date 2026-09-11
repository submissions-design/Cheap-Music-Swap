# Cheap Music Swap

A working prototype of the storefront: a main site (Home, Register, Log In,
Contact Us, Privacy Notice, Terms of Use, Help) plus a shopping-cart
platform (catalog with filters/search, product pages, cart, checkout,
customer accounts, a customer-to-customer marketplace, and an admin area).

Built with Next.js (App Router) + TypeScript + Tailwind CSS, a small SQLite
database (via Node's built-in `node:sqlite` — no external DB service to
install), and a pluggable payment-processor interface.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. A SQLite database file is created automatically
at `data/app.db` on first run, pre-loaded with sample CDs, vinyl, turntables,
and accessories so the catalog isn't empty, plus the admin-managed
categories/genres/artists/carriers described below. Two demo accounts are
seeded:

- Customer: `customer@example.com` / `customer123`
- Admin: `admin@cheapmusicswap.com` / `admin123`

To wipe the database and reseed from scratch, stop the server and delete the
`data/` folder.

For a production run: `npm run build && npm run start`.

## Configuration

Copy `.env.example` to `.env.local` and fill in:

- `AUTH_SECRET` — required before real deployment; signs login sessions.
- `APP_URL` — used to build links in outgoing emails.
- `PAYMENT_PROVIDER` — `mock` by default (see below).
- `EMAIL_PROVIDER` — `console` by default (see below).

### Payment processor configuration (configurable, as requested)

Checkout never talks to a specific payment processor directly — it calls a
`PaymentProvider` interface (`src/lib/payments/types.ts`). The only
implementation included is `MockPaymentProvider`
(`src/lib/payments/mock.ts`), which fabricates a successful charge and
never moves real money — safe for development and demos. It simulates a
decline when a card number ends in `0000`, so the failure path is testable.

To go live with a real processor (Stripe, PayPal, Authorize.net, etc.):

1. Implement `PaymentProvider` in a new file, e.g. `src/lib/payments/stripe.ts`.
2. Register it in `src/lib/payments/index.ts` behind a new `PAYMENT_PROVIDER`
   value.
3. Set `PAYMENT_PROVIDER` and the processor's secret key(s) in the
   environment.

Nothing else changes — checkout, order history, and the account "Payment
Options" screen all go through this one interface, so the processor can be
swapped later without touching the rest of the app, per the original
requirement.

**Note on stored payment methods:** the database only ever stores a
non-sensitive reference (card brand, last 4 digits, expiry, and an opaque
processor token) — never a full card number. A real processor integration
should use that processor's own tokenization/vault (e.g. Stripe Payment
Methods) so full card data never touches this server at all.

### Email configuration

Outgoing email (registration confirmation, order confirmation) goes through
`src/lib/mailer.ts`. By default it just logs the email to the server
console so the flows are fully testable without any email account. Set
`EMAIL_PROVIDER` and implement the corresponding branch in that file to send
real email (SMTP, SendGrid, SES, Postmark, etc.).

### Tax & shipping

Tax rates (by state) and shipping options are stored in the database
(`tax_rates` and `shipping_options` tables, seeded in
`src/lib/db/client.ts`). The seeded tax rates are placeholders for a handful
of states — replace them with the store's real rates (or point
`getTaxRateForState` in `src/lib/db/repo.ts` at a tax API/service) before
launch. Shipping options are flat-rate by default; replace with carrier-rate
lookups the same way if needed.

## Admin capabilities

Everything below is reached from the "Admin" link in the header when logged
in as the admin demo account (or `/admin`).

- **Inventory** (`/admin/inventory`) — search/filter all products (own
  catalog and approved seller listings), add a product, and open one to
  edit its full content, quantity, status, and cover image. Quantity can
  also be adjusted inline from the list. Stock is decremented automatically
  whenever an order is placed (`createOrder` in `src/lib/db/repo.ts`), and
  low/out-of-stock rows are flagged in the list.
- **Categories & Genres** (`/admin/categories`) — add, rename, hide, or
  delete Category (Format) and Genre headings, and clean up the Artist
  list. These drive the top-nav dropdowns, the shop sidebar, and the
  dropdowns shown when adding a product — add a heading here and it
  appears everywhere (with a count of 0) before any product uses it.
  Existing products keep their current text value if a heading they use is
  later renamed or removed (see "Tech notes" below on why format/genre/
  artist stay plain text on the product row rather than foreign keys).
- **Cart Settings** (`/admin/settings`) — tax rates by state, shipping
  options (name/description/flat rate/active/order), and shipping carriers
  (name + tracking URL template, used for the "Track package" link).
- **Orders** (`/admin/orders`) — all orders or just open ones (not yet
  shipped/cancelled), searchable by order number/customer. Each order's
  detail page shows items, shipping address, and lets admin change status,
  select a carrier and enter a tracking number ("Mark Shipped & Email
  Tracking" — sends the customer a tracking email built from that
  carrier's URL template), and message the customer about that specific
  order (also emailed, and visible in the customer's own Messages if they
  have an account).
- **Blog** (`/admin/blog`) — write posts (title, excerpt, body, cover
  image) as a draft or published, and moderate comments (hide/unhide/
  delete) per post. The public `/blog` and `/blog/[slug]` pages are visible
  to everyone; only signed-in account holders can comment.

Product and blog-post cover images uploaded through the admin are saved to
`public/uploads/` (created automatically). That's fine for this prototype
on a single server, but won't survive a redeploy on most hosting platforms
(ephemeral filesystem) or work across multiple server instances — swap
`src/lib/uploads.ts` for S3/Cloud Storage/etc. before a real launch. The
directory is git-ignored, same as `data/`.

## What's here vs. what's still a placeholder

Everything in the spec is implemented and working end-to-end (verified by
scripted walkthroughs of every flow): browsing/search/filter/pagination,
guest and account checkout, order history with cancel-before-shipping,
saved addresses and payment methods, account messaging to admin, the
customer marketplace (submit → admin review → live listing), and the admin
order/message/listing screens.

Three things are intentionally left as placeholders for you to finalize
rather than guessed at:

1. **Payment processor** — runs in mock mode. Needs a real processor account
   and the small integration described above before real money can move.
2. **Outgoing email** — logs to the console. Needs a real email
   account/service before customers actually receive confirmation emails.
3. **Legal pages** — Privacy Notice and Terms of Use are clearly-labeled
   templates, not reviewed by an attorney.

See the project handoff notes for the full punch list of decisions still
needed from you (branding, real inventory, hosting, etc.).

## Project structure

```
src/app/          Pages and routes (App Router) — /admin/* is the dashboard,
                   /blog is the public blog
src/components/   Shared UI components (src/components/admin/ and
                   src/components/blog/ hold admin- and blog-only ones)
src/lib/db/       SQLite schema, typed repository functions, seed data
src/lib/actions/  Server Actions (form handlers) — auth, cart, checkout,
                   account, messages, listings, admin-products, admin-orders,
                   taxonomy, cart-settings, blog
src/lib/payments/ Payment processor interface + mock implementation
src/lib/auth.ts   Session cookies, login/role guards
src/lib/mailer.ts Outgoing email
src/lib/uploads.ts Cover-image upload handling (admin products, blog posts)
```

## Tech notes

- Database: Node's built-in `node:sqlite` (no external DB server needed for
  this size of store). For higher traffic or multi-server hosting, swap
  `src/lib/db/client.ts` for a Postgres client — every other file talks to
  the small repository functions in `src/lib/db/repo.ts`, not to SQLite
  directly, so the swap is contained to those two files plus `schema.sql`.
- `scripts/screenshot.mjs` is a Playwright script used during development to
  visually spot-check every page at desktop and mobile widths — safe to
  delete, or keep for future QA.
- A product's `format`/`genre`/`artist` and a listing's category stay plain
  text columns on `products` rather than foreign keys into
  `categories`/`genres`/`artists`. Those admin-managed tables drive what's
  *browsable* (nav, sidebar, dropdowns) via a `LEFT JOIN`, so a brand-new
  heading shows up immediately with a count of 0, and renaming or deleting
  a heading never breaks an existing product row — it just stops appearing
  in navigation until re-categorized from the product's edit page. This was
  a deliberate scope call to add admin-managed taxonomy without a full
  schema migration; a future pass could turn these into real foreign keys
  with `ON UPDATE CASCADE` if you want renames to also update existing
  products automatically.
