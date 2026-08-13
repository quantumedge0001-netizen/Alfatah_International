-- Delivery Challans — generated from an invoice to confirm goods delivered.
-- Items are snapshotted (copied) from the invoice at the moment the challan
-- is created, same reasoning as invoices snapshotting customer name/address:
-- a challan is a point-in-time delivery record and shouldn't silently change
-- if the invoice is edited later.

create sequence if not exists challan_number_seq;

create table if not exists public.challans (
  id uuid primary key default gen_random_uuid(),
  challan_no text not null unique,
  invoice_id uuid not null references invoices (id) on delete cascade,
  customer_name text not null,
  customer_address text,
  challan_date date not null default current_date,
  payment_method text not null,
  subtotal numeric not null default 0,
  region_id uuid references regions (id),
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.challan_items (
  id uuid primary key default gen_random_uuid(),
  challan_id uuid not null references challans (id) on delete cascade,
  description text not null,
  uom text not null default 'Units',
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  amount numeric not null,
  sort_order integer not null default 0
);

create index if not exists idx_challans_invoice on public.challans using btree (invoice_id);
create index if not exists idx_challans_region on public.challans using btree (region_id);
create index if not exists idx_challan_items_challan on public.challan_items using btree (challan_id);

-- Auto challan numbers: AFIT-DC-<year>-0001, AFIT-DC-<year>-0002, ...
create or replace function generate_challan_no()
returns trigger as $$
begin
  if new.challan_no is null or new.challan_no = '' then
    new.challan_no := 'AFIT-DC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('challan_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_challans_number on challans;
create trigger trg_challans_number before insert on challans
  for each row execute function generate_challan_no();

-- RLS — same region-scoped pattern as invoices (0005).
alter table public.challans enable row level security;
alter table public.challan_items enable row level security;

create policy "challans_scoped_read" on challans for select
  using (
    current_user_role() = 'super_admin'
    or region_id = current_user_region()
    or region_id is null
  );

create policy "challans_scoped_write" on challans for insert
  with check (
    current_user_role() = 'super_admin'
    or region_id = current_user_region()
    or region_id is null
  );

create policy "challans_scoped_delete" on challans for delete
  using (
    current_user_role() = 'super_admin'
    or region_id = current_user_region()
    or region_id is null
  );

create policy "challan_items_scoped_read" on challan_items for select
  using (
    exists (
      select 1 from challans
      where challans.id = challan_items.challan_id
        and (
          current_user_role() = 'super_admin'
          or challans.region_id = current_user_region()
          or challans.region_id is null
        )
    )
  );

create policy "challan_items_scoped_write" on challan_items for insert
  with check (
    exists (
      select 1 from challans
      where challans.id = challan_items.challan_id
        and (
          current_user_role() = 'super_admin'
          or challans.region_id = current_user_region()
          or challans.region_id is null
        )
    )
  );
