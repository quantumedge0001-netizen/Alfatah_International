import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PrivateSalesPage() {
  const supabase = await createClient();
  const { data: sales } = await supabase
    .from("private_sales")
    .select(
      "id, quantity_sold, unit_price, sale_date, delivery_status, private_companies(name, city), products(name)"
    )
    .order("sale_date", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-[#072F5F]">Private Sales</h1>
          <p className="mt-0.5 text-[13px] text-muted">Textile, F&amp;B, pharma, and other private-sector buyers</p>
        </div>
        <Link
          href="/private-sales/new"
          className="rounded-lg bg-[#072F5F] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a3d7a]"
        >
          + New Sale
        </Link>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#072F5F]/15 text-left font-mono text-[10px] uppercase tracking-wider text-[#072F5F]/60">
              <th className="pb-2.5 pr-2">Company</th>
              <th className="pb-2.5 pr-2">City</th>
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
                <td className="py-2.5 pr-2 font-medium text-ink">{row.private_companies?.name ?? "—"}</td>
                <td className="py-2.5 pr-2">
                  <span className="rounded-full bg-[#072F5F]/[0.06] px-2 py-0.5 text-[10.5px] text-[#072F5F]">
                    {row.private_companies?.city ?? "—"}
                  </span>
                </td>
                <td className="py-2.5 pr-2">{row.products?.name ?? "—"}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{row.quantity_sold}</td>
                {/* private_sales has no stored total_price column — computed here */}
                <td className="py-2.5 pr-2 font-mono text-muted">
                  ₨ {(row.quantity_sold * row.unit_price).toLocaleString()}
                </td>
                <td className="py-2.5 pr-2">
                  <span className={`status-pill ${row.delivery_status}`}>{row.delivery_status}</span>
                </td>
                <td className="py-2.5 pr-2 font-mono text-muted">{row.sale_date}</td>
              </tr>
            ))}
            {(!sales || sales.length === 0) && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[13px] text-muted">
                  No private sales recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}