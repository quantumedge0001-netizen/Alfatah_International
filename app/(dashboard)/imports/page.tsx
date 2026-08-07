import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ImportsPage() {
  const supabase = await createClient();
  const { data: imports } = await supabase
    .from("imports")
    .select("id, supplier, country, quantity, total_cost, currency, import_date, products(name), regions(name)")
    .order("import_date", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Import Register</h1>
          <p className="mt-0.5 text-[13px] text-muted">Goods sourced from outside the country</p>
        </div>
        <Link
          href="/imports/new"
          className="rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-white hover:bg-ink2"
        >
          + New Import
        </Link>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-muted">
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
              <tr key={row.id} className="border-b border-paper text-[12.5px] last:border-0">
                <td className="py-2.5 pr-2">{row.products?.name ?? "—"}</td>
                <td className="py-2.5 pr-2">{row.supplier}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{row.country}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{row.quantity}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">
                  {row.currency} {row.total_cost}
                </td>
                <td className="py-2.5 pr-2">{row.regions?.name ?? "—"}</td>
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
