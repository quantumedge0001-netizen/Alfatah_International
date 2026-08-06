-- Membrane Mart — Row Level Security
-- Enforces regional isolation at the database layer so it cannot be
-- bypassed even through direct API calls (design doc, section 2 & 6.1).

-- Helper: read the caller's region straight from their profile row.
create or replace function current_user_region()
returns uuid
language sql
security definer
stable
as $$
  select region_id from profiles where id = auth.uid();
$$;

create or replace function current_user_role()
returns user_role
language sql
security definer
stable
as $$
  select role from profiles where id = auth.uid();
$$;

alter table regions enable row level security;
alter table profiles enable row level security;
alter table government_institutions enable row level security;
alter table products enable row level security;
alter table imports enable row level security;
alter table inventory enable row level security;
alter table sales enable row level security;
alter table sheet_sync_logs enable row level security;

-- Reference tables (regions, institutions, products): readable by any
-- signed-in user, writable only by super_admin.
create policy "regions_read" on regions for select using (auth.uid() is not null);
create policy "regions_write" on regions for all
  using (current_user_role() = 'super_admin')
  with check (current_user_role() = 'super_admin');

create policy "institutions_read" on government_institutions for select using (auth.uid() is not null);
create policy "institutions_write" on government_institutions for all
  using (current_user_role() in ('super_admin', 'admin'))
  with check (current_user_role() in ('super_admin', 'admin'));

create policy "products_read" on products for select using (auth.uid() is not null);
create policy "products_write" on products for all
  using (current_user_role() in ('super_admin', 'admin'))
  with check (current_user_role() in ('super_admin', 'admin'));

-- Profiles: super_admin sees everyone; admin sees their own region;
-- everyone can read their own row.
create policy "profiles_self_read" on profiles for select
  using (id = auth.uid() or current_user_role() = 'super_admin' or region_id = current_user_region());

create policy "profiles_super_admin_write" on profiles for all
  using (current_user_role() = 'super_admin')
  with check (current_user_role() = 'super_admin');

create policy "profiles_admin_creates_users" on profiles for insert
  with check (current_user_role() = 'admin' and region_id = current_user_region() and role = 'user');

-- Core transactional tables: region_id = current_user_region() unless super_admin.
create policy "imports_scoped_read" on imports for select
  using (current_user_role() = 'super_admin' or region_id = current_user_region());
create policy "imports_scoped_write" on imports for insert
  with check (current_user_role() = 'super_admin' or region_id = current_user_region());
create policy "imports_scoped_update" on imports for update
  using (current_user_role() = 'super_admin' or region_id = current_user_region());

create policy "inventory_scoped_read" on inventory for select
  using (current_user_role() = 'super_admin' or region_id = current_user_region());

create policy "sales_scoped_read" on sales for select
  using (current_user_role() = 'super_admin' or region_id = current_user_region());
create policy "sales_scoped_write" on sales for insert
  with check (current_user_role() = 'super_admin' or region_id = current_user_region());
create policy "sales_scoped_update" on sales for update
  using (current_user_role() = 'super_admin' or region_id = current_user_region());

-- Sheet sync logs: read-only for admins and up (Phase 2).
create policy "sync_logs_read" on sheet_sync_logs for select
  using (current_user_role() in ('super_admin', 'admin'));
