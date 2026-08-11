import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SalesPage() {
  const supabase = await createClient();
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
          <h1 className="font-display text-xl font-semibold text-[#072F5F]">Government Sales</h1>
          <p className="mt-0.5 text-[13px] text-muted">Jamshoro · Tharparkar · Umerkot</p>
        </div>
        <Link
          href="/sales/new"
          className="rounded-lg bg-[#072F5F] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a3d7a]"
        >
          + New Sale
        </Link>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#072F5F]/15 text-left font-mono text-[10px] uppercase tracking-wider text-[#072F5F]/60">
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
              <tr key={row.id} className="border-b border-paper text-[12.5px] last:border-0 hover:bg-[#072F5F]/[0.02]">
                <td className="py-2.5 pr-2 font-medium text-ink">{row.government_institutions?.name ?? "—"}</td>
                <td className="py-2.5 pr-2">
                  <span className="rounded-full bg-[#072F5F]/[0.06] px-2 py-0.5 text-[10.5px] text-[#072F5F]">
                    {row.government_institutions?.district ?? "—"}
                  </span>
                </td>
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