-- Invoices — replaces the old MS Word / manual-PDF workflow.
-- An invoice can be billed to an existing private company, an existing
-- government institution, or a one-off customer typed by hand (mirrors how
-- the old Word invoices were free-form). Name/address are snapshotted onto
-- the invoice row itself so a later rename/delete of the company doesn't
-- change historical invoices.

create sequence if not exists invoice_number_seq;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  customer_type text not null check (customer_type in ('private_company', 'government_institution', 'custom')),
  private_company_id uuid references private_companies (id),
  institution_id uuid references government_institutions (id),
  customer_name text not null,
  customer_address text,
  invoice_date date not null default current_date,
  payment_details text default 'Online / Cash',
  notes text,
  subtotal numeric not null default 0,
  grand_total numeric not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  region_id uuid references regions (id),
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  description text not null,
  uom text not null default 'Units',
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  amount numeric not null,
  sale_id uuid references sales (id),
  private_sale_id uuid references private_sales (id),
  sort_order integer not null default 0
);

create index if not exists idx_invoices_region on public.invoices using btree (region_id);
create index if not exists idx_invoices_private_company on public.invoices using btree (private_company_id);
create index if not exists idx_invoices_institution on public.invoices using btree (institution_id);
create index if not exists idx_invoice_items_invoice on public.invoice_items using btree (invoice_id);

-- Auto invoice numbers: AFIT-<year>-0001, AFIT-<year>-0002, ...
create or replace function generate_invoice_no()
returns trigger as $$
begin
  if new.invoice_no is null or new.invoice_no = '' then
    new.invoice_no := 'AFIT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_invoices_number on invoices;
create trigger trg_invoices_number before insert on invoices
  for each row execute function generate_invoice_no();

drop trigger if exists trg_invoices_updated_at on invoices;
create trigger trg_invoices_updated_at before update on invoices
  for each row execute function set_updated_at();

-- RLS — same region-scoped pattern as private_sales (0004): super_admin
-- bypasses, everyone else limited to their own region, null-region rows
-- are visible/writable by anyone signed in (matches private_sales).
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

create policy "invoices_scoped_read" on invoices for select
  using (
    current_user_role() = 'super_admin'
    or region_id = current_user_region()
    or region_id is null
  );

create policy "invoices_scoped_write" on invoices for insert
  with check (
    current_user_role() = 'super_admin'
    or region_id = current_user_region()
    or region_id is null
  );

create policy "invoices_scoped_update" on invoices for update
  using (
    current_user_role() = 'super_admin'
    or region_id = current_user_region()
    or region_id is null
  );

create policy "invoices_scoped_delete" on invoices for delete
  using (
    current_user_role() = 'super_admin'
    or region_id = current_user_region()
    or region_id is null
  );

-- invoice_items follow their parent invoice's access.
create policy "invoice_items_scoped_read" on invoice_items for select
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
        and (
          current_user_role() = 'super_admin'
          or invoices.region_id = current_user_region()
          or invoices.region_id is null
        )
    )
  );

create policy "invoice_items_scoped_write" on invoice_items for insert
  with check (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
        and (
          current_user_role() = 'super_admin'
          or invoices.region_id = current_user_region()
          or invoices.region_id is null
        )
    )
  );

create policy "invoice_items_scoped_delete" on invoice_items for delete
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
        and (
          current_user_role() = 'super_admin'
          or invoices.region_id = current_user_region()
          or invoices.region_id is null
        )
    )
  );
