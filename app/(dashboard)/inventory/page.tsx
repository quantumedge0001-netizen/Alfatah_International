import { createClient } from "@/lib/supabase/server";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: inventory } = await supabase
    .from("inventory")
    .select("id, quantity_available, products(name, unit), regions(name)")
    .order("quantity_available", { ascending: true });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-[#072F5F]">Inventory</h1>
        <p className="mt-0.5 text-[13px] text-muted">Live stock per region, derived from confirmed imports</p>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#072F5F]/15 text-left font-mono text-[10px] uppercase tracking-wider text-[#072F5F]/60">
              <th className="pb-2.5 pr-2">Product</th>
              <th className="pb-2.5 pr-2">Region</th>
              <th className="pb-2.5 pr-2">Available</th>
              <th className="pb-2.5 pr-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(inventory ?? []).map((row: any) => {
              const low = (row.quantity_available ?? 0) < 200;
              return (
                <tr key={row.id} className="border-b border-paper text-[12.5px] last:border-0 hover:bg-[#072F5F]/[0.02]">
                  <td className="py-2.5 pr-2 font-medium text-ink">{row.products?.name ?? "—"}</td>
                  <td className="py-2.5 pr-2">
                    <span className="rounded-full bg-[#072F5F]/[0.06] px-2 py-0.5 text-[10.5px] text-[#072F5F]">
                      {row.regions?.name ?? "—"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 font-mono text-muted">
                    {row.quantity_available} {row.products?.unit}
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className={`status-pill ${low ? "review" : "delivered"}`}>
                      {low ? "Low Stock" : "Healthy"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(!inventory || inventory.length === 0) && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[13px] text-muted">
                  No stock recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}