-- Sample reference data for local development.
-- Run after 0001_init.sql and 0002_rls.sql, or via `supabase db reset`.

insert into regions (name) values ('Karachi'), ('Faisalabad');

insert into government_institutions (name, district, contact_info) values
  ('Public Health Engineering Dept. — Jamshoro', 'Jamshoro', 'phe.jamshoro@gov.pk'),
  ('District Health Office', 'Tharparkar', 'dho.tharparkar@gov.pk'),
  ('Water & Sanitation Agency', 'Umerkot', 'wasa.umerkot@gov.pk');

insert into products (name, category, unit, description) values
  ('PVDF Membrane 0.45µm', 'Filtration Membrane', 'units', 'Polyvinylidene fluoride microfiltration membrane'),
  ('PES Membrane 0.22µm', 'Filtration Membrane', 'units', 'Polyethersulfone sterile-grade membrane'),
  ('PTFE Cartridge Filter', 'Cartridge Filter', 'units', 'Hydrophobic PTFE cartridge for air/gas filtration');

-- NOTE: profiles must be created after the matching auth.users row exists.
-- Easiest path: create the user in Supabase Auth (dashboard or
-- supabase.auth.admin.createUser), then run something like:
--
-- insert into profiles (id, full_name, email, role, region_id, status)
-- values ('<auth-user-uuid>', 'Super Admin', 'super@membranemart.com', 'super_admin', null, 'active');
