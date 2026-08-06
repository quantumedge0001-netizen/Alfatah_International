-- Membrane Mart — initial schema
-- Run via: supabase db push  (or paste into the SQL editor)

create extension if not exists "pgcrypto";

-- 1. Regions -----------------------------------------------------------
create table regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- 2. Profiles (extends auth.users) --------------------------------------
create type user_role as enum ('super_admin', 'admin', 'user');
create type account_status as enum ('active', 'suspended');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'user',
  region_id uuid references regions (id),
  status account_status not null default 'active',
  created_at timestamptz not null default now()
);

-- 3. Government institutions --------------------------------------------
create type district_name as enum ('Jamshoro', 'Tharparkar', 'Umerkot');

create table government_institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district district_name not null,
  contact_info text
);

-- 4. Products -------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  unit text not null default 'units',
  description text
);

-- 5. Imports ---------------------------------------------------------------
create table imports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id),
  supplier text not null,
  country text not null,
  quantity numeric not null check (quantity > 0),
  unit_cost numeric not null check (unit_cost >= 0),
  total_cost numeric not null,
  currency text not null default 'PKR',
  invoice_no text,
  import_date date not null,
  expected_arrival date,
  region_id uuid not null references regions (id),
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Inventory (derived / maintained stock per region) ---------------------
create table inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id),
  region_id uuid not null references regions (id),
  quantity_available numeric not null default 0,
  unique (product_id, region_id)
);

-- 7. Sales -------------------------------------------------------------------
create type sale_status as enum ('pending', 'dispatched', 'delivered');

create table sales (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references government_institutions (id),
  product_id uuid not null references products (id),
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  total_price numeric not null,
  sale_date date not null,
  status sale_status not null default 'pending',
  region_id uuid not null references regions (id),
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Phase 2 — Google Sheets sync audit trail --------------------------------
create type sync_status as enum ('success', 'partial', 'failed');

create table sheet_sync_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  rows_synced integer not null default 0,
  status sync_status not null,
  synced_at timestamptz not null default now()
);

-- 9. Keep inventory in sync with imports and sales ---------------------------
create or replace function apply_import_to_inventory()
returns trigger as $$
begin
  insert into inventory (product_id, region_id, quantity_available)
  values (new.product_id, new.region_id, new.quantity)
  on conflict (product_id, region_id)
  do update set quantity_available = inventory.quantity_available + excluded.quantity_available;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_import_inventory
  after insert on imports
  for each row execute function apply_import_to_inventory();

create or replace function apply_sale_to_inventory()
returns trigger as $$
begin
  update inventory
  set quantity_available = quantity_available - new.quantity
  where product_id = new.product_id and region_id = new.region_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_sale_inventory
  after insert on sales
  for each row execute function apply_sale_to_inventory();

-- 10. updated_at maintenance ---------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_imports_updated_at before update on imports
  for each row execute function set_updated_at();
create trigger trg_sales_updated_at before update on sales
  for each row execute function set_updated_at();
