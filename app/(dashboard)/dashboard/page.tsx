import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import KpiCard from "@/components/KpiCard";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // RLS does the regional filtering here — Super Admin sees every row,
  // Admin/User only see rows where region_id = their own region.
  const [{ count: importsCount }, { data: inventoryRows }, { data: salesRows }] = await Promise.all([
    supabase.from("imports").select("*", { count: "exact", head: true }),
    supabase.from("inventory").select("quantity_available"),
    supabase.from("sales").select("total_price"),
  ]);

  const totalUnits = (inventoryRows ?? []).reduce((sum, r) => sum + (r.quantity_available ?? 0), 0);
  const totalSalesValue = (salesRows ?? []).reduce((sum, r) => sum + (r.total_price ?? 0), 0);
  const lowStockCount = (inventoryRows ?? []).filter((r) => (r.quantity_available ?? 0) < 200).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
            {profile.role === "super_admin" ? "Consolidated Dashboard" : "Regional Dashboard"}
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">
            {profile.role === "super_admin" ? "All regions combined" : "Scoped to your assigned region"}
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-4">
        <KpiCard label="Total Imports" value={String(importsCount ?? 0)} />
        <KpiCard label="Inventory On Hand" value={`${totalUnits.toLocaleString()} units`} />
        <KpiCard label="Government Sales" value={`₨ ${totalSalesValue.toLocaleString()}`} />
        <KpiCard
          label="Low Stock Alerts"
          value={String(lowStockCount)}
          delta={lowStockCount > 0 ? "Below 200 units" : undefined}
          warn
        />
      </div>

      <div className="rounded-xl border border-line bg-card p-6 text-[13px] text-muted">
        This starter wires up live Supabase queries for imports, inventory, and sales — region isolation
        comes for free from the RLS policies in{" "}
        <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-[12px]">supabase/migrations</code>.
        Wire up the charts and tables from the design mockup here once real data is flowing.
      </div>
    </div>
  );
}