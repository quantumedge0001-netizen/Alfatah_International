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

## Roadmap (from the design doc)

| Phase | Deliverables |
|---|---|
| 1 (this scaffold) | Manual import form, manual sales entry, role-based dashboard, PWA install |
| 2 | Google Sheets → Supabase automated sync via scheduled Edge Function |
| 3 | Analytics dashboard — sales trends per district, stock forecasting, notifications |
| 4 | Native desktop packaging (Tauri) with offline-first sync queue |
