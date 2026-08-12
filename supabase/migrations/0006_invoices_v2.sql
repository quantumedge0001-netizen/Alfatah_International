-- Invoices v2 — payment method dropdown + expanded government coverage
-- (Islamkot, Mithi — both in Tharparkar) + a starter list of the private
-- companies the business already deals with.

-- 1. Expand government districts. `alter type ... add value` can't run
-- inside the same transaction as a later statement that uses the new
-- value, so this is its own statement.
alter type district_name add value if not exists 'Islamkot';
alter type district_name add value if not exists 'Mithi';

-- 2. Payment method — was a free-text "payment_details" field; invoicing
-- now always picks one of exactly two methods, so lock it down.
alter table invoices rename column payment_details to payment_method;
alter table invoices alter column payment_method drop default;
update invoices set payment_method = 'Cash' where payment_method not in ('Online', 'Cash') or payment_method is null;
alter table invoices alter column payment_method set not null;
alter table invoices alter column payment_method set default 'Cash';
alter table invoices add constraint invoices_payment_method_check check (payment_method in ('Online', 'Cash'));

-- 3. Starter private-company customers (city/contact left blank — add those
-- from the Private Companies admin page where known).
insert into private_companies (name)
select name from (values
  ('Sitara Fabrics'),
  ('Jubilee Textile'),
  ('Rasheed Enterprises'),
  ('Dawlance'),
  ('Spell')
) as v(name)
where not exists (
  select 1 from private_companies where private_companies.name = v.name
);
