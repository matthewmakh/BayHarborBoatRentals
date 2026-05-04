# Bay Harbor Boat Rentals

Production-ready full-stack site for **Bay Harbor Boat Rentals** (Bay Harbor Islands, FL).

- **Stack:** Next.js 14 (App Router) · TypeScript · TailwindCSS · PostgreSQL · Prisma · Stripe Checkout · Calendly · Railway
- **Public site:** home, boats listing, boat detail, booking flow, waiver, reviews, contact
- **Admin portal at `/admin`:** manage boats, photos, prices, deposits, bookings, waivers, reviews, settings, social links, Calendly URL
- **Booking flow:** customer picks boat → duration → time slot via Calendly → submits details → signs waiver → pays Stripe deposit (server-calculated) → webhook confirms

> Boat data is **never** hardcoded into the public pages — every boat, photo, price, and setting is editable from the admin portal.

---

## Local development

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET, etc.

# 3. Database
npx prisma migrate dev --name init
npm run seed

# 4. Run
npm run dev
# → http://localhost:3000
# → http://localhost:3000/admin/login
```

`npm run seed` creates:
- 3 sample boats with photos
- 3 sample reviews
- universal waiver (v1, active)
- default site settings (phone, email, address, deposit %=30, instant reservations enabled)
- the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`

---

## Environment variables

All variables are documented in `.env.example`. Required for production:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Railway provides this) |
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployed site (used for Stripe redirects) |
| `SESSION_SECRET` | Min 16 chars — used to sign admin session cookies |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap credentials for the first admin user |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_…) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_…) |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI / dashboard webhook secret (whsec_…) |
| `CALENDLY_URL` | Calendly event URL (admin can override in Settings) |
| `NOTIFICATION_EMAIL` | Where booking/waiver/payment notifications go (default `daniel@bayharborboatrentals.com`) |
| `EMAIL_PROVIDER` | `resend` \| `sendgrid` \| `smtp` \| `console` (no-op log for dev) |
| `EMAIL_FROM` | "Bay Harbor Boat Rentals \<noreply@…\>" |
| `RESEND_API_KEY` | If `EMAIL_PROVIDER=resend` |
| `SENDGRID_API_KEY` | If `EMAIL_PROVIDER=sendgrid` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_SECURE` | If `EMAIL_PROVIDER=smtp` |

---

## Railway deployment

1. **Create a new Railway project** and add a **PostgreSQL** plugin. Copy the auto-generated `DATABASE_URL` into your app's variables.
2. **Deploy this repo** as a Node service. Railway auto-detects Next.js.
3. Set the variables from the table above. Generate `SESSION_SECRET` with `openssl rand -base64 48`.
4. The build script runs migrations automatically:
   ```
   prisma generate && prisma migrate deploy && next build
   ```
5. After the first deploy, run the seed once from Railway's shell:
   ```bash
   npm run seed
   ```
   This creates the admin user, default settings, sample boats, and the universal waiver.

### Stripe webhook on Railway

1. In the Stripe dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR-DOMAIN/api/stripe/webhook`
3. Listen for events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
4. Copy the signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET` on Railway and redeploy.

### Local Stripe testing

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the printed whsec_ value into .env as STRIPE_WEBHOOK_SECRET
```

---

## Stripe setup notes (the business does not yet have a Stripe account)

The integration is fully built and gated behind environment variables:

- Until `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are set, the deposit step shows a friendly "Stripe not yet configured" message and bookings remain in `waiver_completed` until manually advanced.
- When the owner creates a Stripe account, just paste the keys into Railway and redeploy — no code changes.
- Prices and deposits are **always** computed on the server from the database; the client never sets the amount.
- The Stripe webhook is the source of truth for `deposit_paid`. The booking status only flips after Stripe confirms.

---

## Calendly setup

1. Create a Calendly event type (e.g. "Bay Harbor Boat Rental").
2. Copy the public URL (`https://calendly.com/yourhandle/boat-rental`).
3. Either set `CALENDLY_URL` in Railway env vars **or** edit it from `/admin/settings` (database value overrides env).
4. The booking page embeds the Calendly widget. When a customer picks a slot, the page captures the Calendly event URI via `postMessage` and stores it on the booking.

---

## Admin portal

- Sign in: `/admin/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- Dashboard: `/admin` — quick stats, Stripe/Calendly health, recent bookings.
- **Boats** `/admin/boats` — create, edit, delete. Edit page includes a photo manager (paste image URLs from any host/CDN; reorder with up/down; delete).
- **Bookings** `/admin/bookings` — list + detail page with full waiver record (IP, user agent, signed name, version) and Stripe payment record.
- **Waiver** `/admin/waiver` — edit and publish a new version (versioning preserved). View recent submissions.
- **Reviews** `/admin/reviews` — add/edit/delete testimonials shown on the home page.
- **Settings** `/admin/settings` — phone, email, address, social URLs, Calendly URL, deposit %, instant reservations toggle, payment methods text, hero copy.

### Adding more admin users

There's no UI for this MVP — connect to the database and `INSERT` (the schema accepts any number of `AdminUser` rows; passwords are bcrypt-hashed). You can bootstrap from a Node REPL on Railway:

```js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();
await p.adminUser.create({ data: { email: "...", passwordHash: await bcrypt.hash("password", 10) } });
```

---

## Photo storage

The MVP stores photo URLs (admin pastes a hosted URL — Cloudinary, Imgix, S3 + CloudFront, Bunny CDN, or even Unsplash for placeholders). Direct file uploads were intentionally left out of v1 to avoid coupling to a specific blob provider — drop in S3/Cloudinary later by extending `/api/admin/boats/[id]/photos`.

---

## Database models

Prisma models (see `prisma/schema.prisma`):

- `AdminUser` · `Boat` · `BoatPhoto` · `Booking` · `WaiverVersion` · `WaiverSubmission` · `Review` · `SiteSetting` · `StripePayment`

Booking statuses: `pending_waiver`, `waiver_completed`, `pending_payment`, `deposit_paid`, `cancelled`, `completed`.

---

## Notifications

Each event below sends a templated email to `NOTIFICATION_EMAIL`:

- Booking submitted
- Waiver completed
- Stripe deposit paid (only after webhook confirms)

Provider is selected by `EMAIL_PROVIDER` — `resend` (recommended), `sendgrid`, or generic `smtp`. Defaults to `console` (logs only) so dev/staging don't accidentally email anyone.

---

## Branding

Blue + white coastal/luxury palette defined in `tailwind.config.ts`. The text-based brand mark lives in `src/components/Brand.tsx`. Drop in a real logo later by replacing that component.

Phone number `516-974-8874` is repeated as a CTA across hero, header, footer, and contact section. Address `9901 E Bay Harbor Drive, Bay Harbor Islands, Florida 33154` is rendered in footer + contact section + Google Maps embed. Both are editable in `/admin/settings`.
