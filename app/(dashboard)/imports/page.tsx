import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { regionFilterFor } from "@/lib/authorization";

export default async function ImportsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("imports")
    .select("id, supplier, country, quantity, total_cost, currency, import_date, products(name), regions(name)")
    .order("import_date", { ascending: false })
    .limit(50);

  // regionFilterFor returns null for super_admin (no filter — sees every
  // region), or the user's own region_id for admin/user — same rule used
  // in lib/actions/imports.ts on create, so a region an Admin/User can't
  // write to also never shows up in this list.
  const regionFilter = regionFilterFor(profile);
  if (regionFilter) {
    query = query.eq("region_id", regionFilter);
  }

  const { data: imports } = await query;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-[#072F5F]">Import Register</h1>
          <p className="mt-0.5 text-[13px] text-muted">Goods sourced from outside the country</p>
        </div>
        <Link
          href="/imports/new"
          className="rounded-lg bg-[#072F5F] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a3d7a]"
        >
          + New Import
        </Link>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#072F5F]/15 text-left font-mono text-[10px] uppercase tracking-wider text-[#072F5F]/60">
              <th className="pb-2.5 pr-2">Product</th>
              <th className="pb-2.5 pr-2">Supplier</th>
              <th className="pb-2.5 pr-2">Origin</th>
              <th className="pb-2.5 pr-2">Qty</th>
              <th className="pb-2.5 pr-2">Total Cost</th>
              <th className="pb-2.5 pr-2">Region</th>
              <th className="pb-2.5 pr-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {(imports ?? []).map((row: any) => (
              <tr key={row.id} className="border-b border-paper text-[12.5px] last:border-0 hover:bg-[#072F5F]/[0.02]">
                <td className="py-2.5 pr-2 font-medium text-ink">{row.products?.name ?? "—"}</td>
                <td className="py-2.5 pr-2">{row.supplier}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{row.country}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{row.quantity}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">
                  {row.currency} {row.total_cost}
                </td>
                <td className="py-2.5 pr-2">
                  <span className="rounded-full bg-[#072F5F]/[0.06] px-2 py-0.5 text-[10.5px] text-[#072F5F]">
                    {row.regions?.name ?? "—"}
                  </span>
                </td>
                <td className="py-2.5 pr-2 font-mono text-muted">{row.import_date}</td>
              </tr>
            ))}
            {(!imports || imports.length === 0) && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[13px] text-muted">
                  No import records yet. Add the first one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
