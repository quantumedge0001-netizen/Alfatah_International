import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SalesPage() {
  const supabase = createClient();
  const { data: sales } = await supabase
    .from("sales")
    .select(
      "id, quantity, total_price, sale_date, status, government_institutions(name, district), products(name)"
    )
    .order("sale_date", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Government Sales</h1>
          <p className="mt-0.5 text-[13px] text-muted">Jamshoro · Tharparkar · Umerkot</p>
        </div>
        <Link
          href="/sales/new"
          className="rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-white hover:bg-ink2"
        >
          + New Sale
        </Link>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-muted">
              <th className="pb-2.5 pr-2">Institution</th>
              <th className="pb-2.5 pr-2">District</th>
              <th className="pb-2.5 pr-2">Product</th>
              <th className="pb-2.5 pr-2">Qty</th>
              <th className="pb-2.5 pr-2">Value</th>
              <th className="pb-2.5 pr-2">Status</th>
              <th className="pb-2.5 pr-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {(sales ?? []).map((row: any) => (
              <tr key={row.id} className="border-b border-paper text-[12.5px] last:border-0">
                <td className="py-2.5 pr-2">{row.government_institutions?.name ?? "—"}</td>
                <td className="py-2.5 pr-2">{row.government_institutions?.district ?? "—"}</td>
                <td className="py-2.5 pr-2">{row.products?.name ?? "—"}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{row.quantity}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">₨ {row.total_price}</td>
                <td className="py-2.5 pr-2">
                  <span className={`status-pill ${row.status}`}>{row.status}</span>
                </td>
                <td className="py-2.5 pr-2 font-mono text-muted">{row.sale_date}</td>
              </tr>
            ))}
            {(!sales || sales.length === 0) && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[13px] text-muted">
                  No sales recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
