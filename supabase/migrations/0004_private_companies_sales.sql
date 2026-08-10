-- AF-DOS — Private Sector Customer 360
-- Documents the private_companies / private_sales tables that already exist
-- in the live Supabase project (created directly via SQL editor). This file
-- exists so the schema is captured in version control and RLS is applied
-- consistently with the government-side tables. Uses `if not exists` /
-- `do $$ ... $$` guards so it is safe to run even though the tables already
-- exist in production.

create table if not exists public.private_companies (
  id uuid not null default gen_random_uuid(),
  name text not null,
  city text null,
  contact_info text null,
  region_id uuid null,
  created_at timestamp with time zone not null default now(),
  constraint private_companies_pkey primary key (id),
  constraint private_companies_region_id_fkey foreign key (region_id) references regions (id)
);

create table if not exists public.private_sales (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  product_id uuid not null,
  quantity_sold numeric not null,
  unit_price numeric not null,
  sale_date date not null default current_date,
  delivery_status text not null default 'pending'::text,
  region_id uuid null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  constraint private_sales_pkey primary key (id),
  constraint private_sales_created_by_fkey foreign key (created_by) references profiles (id),
  constraint private_sales_company_id_fkey foreign key (company_id) references private_companies (id) on delete restrict,
  constraint private_sales_product_id_fkey foreign key (product_id) references products (id) on delete restrict,
  constraint private_sales_region_id_fkey foreign key (region_id) references regions (id),
  constraint private_sales_quantity_sold_check check ((quantity_sold > (0)::numeric)),
  constraint private_sales_delivery_status_check check (
    (delivery_status = any (array['pending'::text, 'delivered'::text, 'cancelled'::text]))
  ),
  constraint private_sales_unit_price_check check ((unit_price >= (0)::numeric))
);

create index if not exists idx_private_sales_region on public.private_sales using btree (region_id);
create index if not exists idx_private_sales_company on public.private_sales using btree (company_id);
create index if not exists idx_private_sales_product on public.private_sales using btree (product_id);

-- RLS — mirrors 0002_rls.sql's pattern for imports/sales (region-scoped,
-- super_admin bypasses). Both tables allow a NULL region_id (per your
-- schema), so the read policy also allows rows where region_id is unset —
-- flagging this choice: if you'd rather NULL-region rows be super_admin-only,
-- tell me and I'll tighten it.

alter table public.private_companies enable row level security;
alter table public.private_sales enable row level security;

create policy "private_companies_read" on private_companies for select
  using (auth.uid() is not null);

create policy "private_companies_write" on private_companies for insert
  with check (current_user_role() in ('super_admin', 'admin'));

create policy "private_companies_update" on private_companies for update
  using (current_user_role() in ('super_admin', 'admin'));

create policy "private_sales_scoped_read" on private_sales for select
  using (
    current_user_role() = 'super_admin'
    or region_id = current_user_region()
    or region_id is null
  );

create policy "private_sales_scoped_write" on private_sales for insert
  with check (
    current_user_role() = 'super_admin'
    or region_id = current_user_region()
    or region_id is null
  );

create policy "private_sales_scoped_update" on private_sales for update
  using (
    current_user_role() = 'super_admin'
    or region_id = current_user_region()
    or region_id is null
  );
