import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StockPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("stock_items")
    .select("id, item_description, condition, origin_make, model_type, size_capacity, quantity, unit_price, amount")
    .order("created_at", { ascending: false });

  const totalAmount = (items ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-[#072F5F]">Stock</h1>
          <p className="mt-0.5 text-[13px] text-muted">Manually recorded stock items</p>
        </div>
        <Link
          href="/stock/new"
          className="rounded-lg bg-[#072F5F] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a3d7a]"
        >
          + New Stock Item
        </Link>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#072F5F]/15 text-left font-mono text-[10px] uppercase tracking-wider text-[#072F5F]/60">
              <th className="pb-2.5 pr-2">S#</th>
              <th className="pb-2.5 pr-2">Item Description</th>
              <th className="pb-2.5 pr-2">New/Ref</th>
              <th className="pb-2.5 pr-2">Origin/Make</th>
              <th className="pb-2.5 pr-2">Model/Type</th>
              <th className="pb-2.5 pr-2">Size/Capacity</th>
              <th className="pb-2.5 pr-2">Qty</th>
              <th className="pb-2.5 pr-2">Unit Price (PKR)</th>
              <th className="pb-2.5 pr-2">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((row, i) => (
              <tr key={row.id} className="border-b border-paper text-[12.5px] last:border-0 hover:bg-[#072F5F]/[0.02]">
                <td className="py-2.5 pr-2 font-mono text-muted">{i + 1}</td>
                <td className="py-2.5 pr-2 font-medium text-ink">{row.item_description}</td>
                <td className="py-2.5 pr-2">
                  {row.condition && (
                    <span className="rounded-full bg-[#072F5F]/[0.06] px-2 py-0.5 text-[10.5px] text-[#072F5F]">
                      {row.condition}
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-2">{row.origin_make ?? "—"}</td>
                <td className="py-2.5 pr-2">{row.model_type ?? "—"}</td>
                <td className="py-2.5 pr-2">{row.size_capacity ?? "—"}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{row.quantity}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">
                  {Number(row.unit_price).toLocaleString()}
                </td>
                <td className="py-2.5 pr-2 font-mono font-medium text-ink">
                  {Number(row.amount).toLocaleString()}
                </td>
              </tr>
            ))}
            {(!items || items.length === 0) && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[13px] text-muted">
                  No stock items yet. Add the first one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {items && items.length > 0 && (
          <div className="mt-4 flex justify-end border-t border-line pt-3">
            <div className="text-[13px] text-muted">
              Total: <span className="font-mono font-semibold text-[#072F5F]">₨ {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}