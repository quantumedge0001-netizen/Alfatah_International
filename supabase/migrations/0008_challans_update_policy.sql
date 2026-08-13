-- Found by actually running the new automatic sale -> invoice -> challan
-- flow (lib/invoices/auto.ts) against a real regional test account and
-- checking what landed in the DB: three RLS gaps that silently blocked
-- writes needed by that flow (no error thrown — the row just doesn't
-- change, which is worse than a crash because it looks like it worked).
--
-- 1. `challans` had no UPDATE policy — needed to bump a challan's subtotal
--    when a later same-day sale for the same customer is appended, or when
--    a sale behind it is corrected.
-- 2. `challan_items` had no DELETE policy — needed to re-take the challan's
--    item snapshot (delete + reinsert) on every resync. Without it, old
--    items never got removed and duplicates piled up on every correction.
-- 3. `invoice_items` had no UPDATE policy — needed to correct an item
--    in-place when a sale behind it is edited (same customer/date, so no
--    invoice move is needed). Without it, a corrected sale price never
--    actually reached its invoice.

-- drop-if-exists first: safe to run even if a same-named (or differently
-- named but equivalent) policy already exists on the live project from
-- earlier manual dashboard changes.
drop policy if exists "challans_scoped_update" on challans;
create policy "challans_scoped_update" on challans for update
  using (
    current_user_role() = 'super_admin'
    or region_id = current_user_region()
    or region_id is null
  );

drop policy if exists "challan_items_scoped_delete" on challan_items;
create policy "challan_items_scoped_delete" on challan_items for delete
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

drop policy if exists "invoice_items_scoped_update" on invoice_items;
create policy "invoice_items_scoped_update" on invoice_items for update
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
