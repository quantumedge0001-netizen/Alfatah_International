# Membrane Mart

Import & Government Sales Management Platform. Next.js (App Router, TypeScript) + Supabase,
delivered as a PWA. Built from the project's system design document.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Row Level Security, Storage)
- **Delivery:** PWA (installable) — desktop packaging via Tauri/Electron is a later phase
- **Hosting:** Vercel (app) + Supabase Cloud (database)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

## Setting up Supabase

1. Create a project at supabase.com.
2. In the SQL editor, run the migrations in order:
   - `supabase/migrations/0001_init.sql` — tables, triggers
   - `supabase/migrations/0002_rls.sql` — Row Level Security policies
   - `supabase/seed.sql` — sample regions, institutions, and products
3. Create your first user in **Authentication → Users** (email/password), then link it
   to a profile as `super_admin`:

   ```sql
   insert into profiles (id, full_name, email, role, region_id, status)
   values ('<the-auth-user-uuid>', 'Your Name', 'you@membranemart.com', 'super_admin', null, 'active');
   ```

4. The Super Admin can then create Admin accounts (Auth invite + a `profiles` row with
   `role = 'admin'` and a `region_id`), and each Admin creates their own Users.
5. Copy the project URL and anon key from **Settings → API** into `.env.local`.

## How access control works

Three tiers — `super_admin`, `admin`, `user` — enforced in two places at once, per the
design doc:

- **App layer:** `middleware.ts` blocks `/admin/*` routes by role before the page renders.
- **Database layer:** every transactional table (`imports`, `inventory`, `sales`) carries a
  `region_id`. RLS policies in `0002_rls.sql` filter every query through
  `current_user_region()`, so an Admin or User can never see another region's data — even
  through a direct API call. Only `super_admin` policies bypass the region filter.

Regional isolation lives in the database, not in application code, so it holds even if a
future client (mobile app, integration, etc.) talks to Supabase directly.

## Project structure

```
app/
  login/                    Sign-in page
  (dashboard)/              Everything behind auth, wrapped in the sidebar shell
    dashboard/               KPI overview, region-scoped via RLS
    imports/                 Import register (list + new form)
    inventory/                Live stock per region
    sales/                   Government sales (list + new form)
    admin/
      regions/                Super Admin only
      users/                   Admin and up
      institutions/            Jamshoro / Tharparkar / Umerkot buyers
lib/
  supabase/                 Browser, server, and middleware Supabase clients
  actions/                  Server Actions (sign in/out, create import, create sale)
  auth.ts                   requireProfile() — session + role helper
  types.ts                  Hand-written types matching the schema
supabase/
  migrations/                Schema + RLS, run in order
  seed.sql                   Sample reference data
public/
  manifest.json, sw.js       PWA install + basic offline app-shell caching
```

## What's stubbed vs. wired up

**Wired up:** auth (sign in/out), role-based route guards, the dashboard KPIs, the imports
and sales list + create flows, inventory view, and the full RLS-backed schema.

**Left for you:**
- File attachments for imports (invoice/customs docs) — the design doc calls for Supabase
  Storage; add a bucket and an upload field to `ImportForm`.
- Charts on the dashboard (the design mock in this thread shows a bar-chart treatment —
  swap in `recharts` or similar once real data volume makes sense).
- Admin account creation UI (currently documented as a manual step via Supabase Auth).
- Phase 2: the Google Sheets → Supabase Edge Function sync job, and a UI for
  `sheet_sync_logs`.
- App icons in `public/icons/` (referenced by `manifest.json` — add your own 192×192 and
  512×512 PNGs).

## AF-DOS Phase 1 — Lead / Webhook / Automation backbone

Added on top of the existing scaffold, per the AF-DOS backend prompt. Nothing
below touches `imports`, `sales`, `inventory`, `profiles`, or the two
pre-existing lead tables (`"Al Fatah Leads Ad Data"`, `leads_calling_list`) —
those are untouched and still readable exactly as before.

### What's new

```
app/api/webhooks/meta/route.ts     Meta Lead Ads webhook (GET verify, POST receive)
lib/integrations/meta/             types.ts, verify.ts (HMAC + challenge), client.ts (Graph API), leads.ts (adapter)
lib/services/lead.service.ts       canonical upsert, dedup on (source, external_id)
lib/services/automation.service.ts NEW_LEAD event bus; assignLead() is a TODO stub
lib/services/notification.service.ts  channel-agnostic; only in_app is wired up
lib/services/audit.service.ts      append-only audit_logs writer
lib/supabase/service.ts            service-role client — server/webhook code only
supabase/migrations/0003_leads_webhooks.sql   leads, webhook_events, lead_sources, notifications, audit_logs
```

### Setup

1. Run the new migration in the Supabase SQL editor, after `0001` and `0002`:
   - `supabase/migrations/0003_leads_webhooks.sql`
2. Add to `.env.local` (see updated `.env.example`):
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   META_APP_SECRET=...
   META_ACCESS_TOKEN=...       # Page access token with leads_retrieval permission
   META_VERIFY_TOKEN=...       # any random string you choose
   ```
3. `npm install` then `npm run build` to confirm it compiles against your actual `node_modules` — this was written and reviewed without a network-connected sandbox, so it hasn't been run through `tsc` yet. Report back any type errors and I'll fix them immediately.

### Registering the webhook with Meta

In your Meta App dashboard → Webhooks → Page → Callback URL:
`https://<your-vercel-domain>/api/webhooks/meta`, Verify Token = your `META_VERIFY_TOKEN`.
Subscribe to the `leadgen` field.

### Local testing (before going live with Meta)

Signature verification means you can't just `curl` a fake payload — it'll get
a 401 by design. To test the pipeline locally:

1. Temporarily comment out the `verifyMetaSignature` check in
   `app/api/webhooks/meta/route.ts` (or export a test-only flag) — **do not
   ship that change**, it's local-only.
2. POST a body shaped like `MetaWebhookEnvelope` (see `lib/integrations/meta/types.ts`)
   to `http://localhost:3000/api/webhooks/meta`.
3. Since `fetchMetaLeadDetail` calls the real Graph API, either use a real
   `leadgen_id` + valid `META_ACCESS_TOKEN` from a Meta test lead, or
   temporarily stub `fetchMetaLeadDetail` to return a fixture `MetaLeadDetail`.
4. Check `webhook_events` and `leads` tables in Supabase to confirm the row landed.
5. POST the exact same body again — confirm no duplicate row is created and
   the webhook_events row for that leadgen_id is untouched (idempotency check).

### What's intentionally NOT done yet (waiting on your decisions)

- **Lead assignment** (`assignLead()` in `automation.service.ts`) — left as a
  documented no-op. No rule was defined, so it doesn't guess one.
- **Email/Telegram/WhatsApp notifications** — `notification.service.ts` writes
  the `notifications` row (so `in_app` works end-to-end) but does not call any
  external API, since no credentials exist in this repo yet.
- **Migrating old rows** from `"Al Fatah Leads Ad Data"` / `leads_calling_list`
  into the new `leads` table — not done automatically; those tables are left
  as-is until you decide whether/how to backfill.
- **Automated tests** (Phase 14 of the prompt) — not included in this pass;
  next step once Phase 1 is confirmed working.

## Roadmap (from the design doc)

| Phase | Deliverables |
|---|---|
| 1 (this scaffold) | Manual import form, manual sales entry, role-based dashboard, PWA install |
| 2 | Google Sheets → Supabase automated sync via scheduled Edge Function |
| 3 | Analytics dashboard — sales trends per district, stock forecasting, notifications |
| 4 | Native desktop packaging (Tauri) with offline-first sync queue |
