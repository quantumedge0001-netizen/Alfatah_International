-- AF-DOS Phase 1 — Lead / Webhook / Automation / Notification backbone
-- Run via: supabase db push  (or paste into the SQL editor), AFTER 0001 + 0002.
--
-- IMPORTANT — READ BEFORE RUNNING:
-- This migration does NOT touch, rename, or drop the existing
-- "Al Fatah Leads Ad Data" or "leads_calling_list" tables. Those were
-- created outside version control (likely by a no-code sync tool) and are
-- left exactly as-is. This migration adds a NEW, separate canonical
-- `leads` table plus supporting infrastructure. Deciding whether/how to
-- migrate old rows into `leads` is a deliberate follow-up step, not done
-- here automatically.

-- 1. lead_sources ------------------------------------------------------------
-- Reference table describing where a lead can come from. Seeded with the
-- sources named in the AF-DOS context doc; more can be added later without
-- a schema change.
create type lead_source_type as enum ('meta', 'google_sheets', 'website', 'manual', 'other');

create table lead_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type lead_source_type not null,
  configuration jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

insert into lead_sources (name, type, status) values
  ('Meta Lead Ads', 'meta', 'active'),
  ('Google Sheets', 'google_sheets', 'planned'),
  ('Website Form', 'website', 'planned'),
  ('Manual Entry', 'manual', 'active');

-- 2. webhook_events -----------------------------------------------------------
-- Raw, append-only log of every inbound webhook delivery. This is the
-- idempotency backbone (Phase 6): a unique constraint on
-- (source, external_event_id) makes duplicate deliveries a no-op at the
-- database level, not just an application-level check.
create type webhook_event_status as enum ('received', 'processing', 'processed', 'failed', 'ignored');

create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_event_id text not null,
  event_type text,
  payload jsonb not null,
  status webhook_event_status not null default 'received',
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source, external_event_id)
);

create index idx_webhook_events_status on webhook_events (status);
create index idx_webhook_events_source on webhook_events (source);

-- 3. leads (canonical) ---------------------------------------------------------
-- Canonical internal Lead shape. Every source-specific adapter
-- (lib/integrations/<source>/leads.ts) must map into this shape — no
-- source-specific fields belong here or in the services that consume it.
create type lead_status as enum ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost');

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  email text,
  source text not null,                 -- matches lead_sources.type, e.g. 'meta'
  external_id text not null,             -- source's own lead/record id
  raw_payload jsonb,                     -- original normalized payload for audit/debug
  requirement text,                      -- free-text: product/capacity interest, if known
  status lead_status not null default 'new',
  assigned_to uuid references profiles (id),   -- NULL = unassigned; see automation.service.ts TODO
  region_id uuid references regions (id),      -- nullable: not every lead source implies a region
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id)           -- THE dedup key (Phase 6 / context doc section 21.2)
);

create index idx_leads_status on leads (status);
create index idx_leads_assigned_to on leads (assigned_to);
create index idx_leads_source on leads (source);

create trigger trg_leads_updated_at before update on leads
  for each row execute function set_updated_at();  -- reuses function from 0001_init.sql

-- 4. notifications ---------------------------------------------------------------
create type notification_channel as enum ('in_app', 'email', 'telegram', 'whatsapp', 'push');
create type notification_status as enum ('pending', 'sent', 'failed');

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient uuid references profiles (id),
  type text not null,                    -- e.g. 'NEW_LEAD'
  channel notification_channel not null default 'in_app',
  title text not null,
  message text,
  status notification_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_recipient on notifications (recipient);
create index idx_notifications_status on notifications (status);

-- 5. audit_logs -----------------------------------------------------------------
-- Append-only. Never update or delete rows here from application code.
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text,                            -- profile id (as text) or 'system' for webhook-driven actions
  action text not null,                  -- e.g. 'lead.created', 'webhook.rejected'
  entity_type text,                      -- e.g. 'lead'
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_entity on audit_logs (entity_type, entity_id);

-- 6. Row Level Security ------------------------------------------------------------
-- These tables are written primarily by the service-role client from webhook
-- routes (which bypasses RLS entirely — see lib/supabase/service.ts). RLS
-- here governs what authenticated app users can see/do via the normal
-- browser/server client, following the same super_admin/admin/user pattern
-- as 0002_rls.sql.

alter table lead_sources enable row level security;
alter table webhook_events enable row level security;
alter table leads enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

create policy "lead_sources_read" on lead_sources for select using (auth.uid() is not null);
create policy "lead_sources_write" on lead_sources for all
  using (current_user_role() = 'super_admin')
  with check (current_user_role() = 'super_admin');

-- Webhook events are operational/debug data — restrict to admin and up.
create policy "webhook_events_read" on webhook_events for select
  using (current_user_role() in ('super_admin', 'admin'));

-- Leads: readable by any signed-in user for now (no region concept applies
-- to leads yet — TODO once territory-based assignment is defined, section 21.1).
-- Updatable by admin/super_admin (e.g. reassigning) or by the assigned user.
create policy "leads_read" on leads for select using (auth.uid() is not null);
create policy "leads_update" on leads for update
  using (current_user_role() in ('super_admin', 'admin') or assigned_to = auth.uid());

-- Notifications: users see only their own.
create policy "notifications_read_own" on notifications for select
  using (recipient = auth.uid());
create policy "notifications_update_own" on notifications for update
  using (recipient = auth.uid());

-- Audit logs: admin and up, read-only from the app layer.
create policy "audit_logs_read" on audit_logs for select
  using (current_user_role() in ('super_admin', 'admin'));
