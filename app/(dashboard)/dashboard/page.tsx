import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Package, Ship, Landmark, AlertTriangle } from "lucide-react";
import KpiCard from "@/components/KpiCard";
import SalesTrendChart from "@/components/charts/SalesTrendChart";
import InventoryDonutChart from "@/components/charts/InventoryDonutChart";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ count: importsCount }, { data: inventoryRows }, { data: salesRows }] = await Promise.all([
    supabase.from("imports").select("*", { count: "exact", head: true }),
    supabase.from("inventory").select("quantity_available"),
    supabase.from("sales").select("total_price"),
  ]);

  const totalUnits = (inventoryRows ?? []).reduce((sum, r) => sum + (r.quantity_available ?? 0), 0);
  const totalSalesValue = (salesRows ?? []).reduce((sum, r) => sum + (r.total_price ?? 0), 0);
  const lowStockCount = (inventoryRows ?? []).filter((r) => (r.quantity_available ?? 0) < 200).length;
  const healthyStockCount = (inventoryRows ?? []).length - lowStockCount;

  // Guarded query — only works if `sales.created_at` exists. Fails silently otherwise.
  let monthlyTrend: { month: string; total: number }[] = [];
  try {
    const { data: dated, error } = await supabase
      .from("sales")
      .select("total_price, created_at")
      .order("created_at", { ascending: true });

    if (!error && dated) {
      const grouped = new Map<string, number>();
      for (const row of dated as { total_price: number; created_at: string }[]) {
        const label = new Date(row.created_at).toLocaleDateString("en-US", { month: "short" });
        grouped.set(label, (grouped.get(label) ?? 0) + (row.total_price ?? 0));
      }
      monthlyTrend = Array.from(grouped, ([month, total]) => ({ month, total }));
    }
  } catch {
    monthlyTrend = [];
  }

  return (
    <div>
      {/* Hero / welcome card */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-line bg-gradient-to-br from-ink to-ink2 p-6 text-[#dbe6e4] sm:flex-row sm:items-center">
        <div>
          <div className="text-[13px] text-[#8fb0aa]">Welcome back</div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-[#f3f5f2]">
            {profile.full_name}
          </h1>
          <p className="mt-1 text-[13px] text-[#b7c8c5]">
            {profile.role === "super_admin" ? "Consolidated view — all regions combined" : "Scoped to your assigned region"}
          </p>
        </div>
        <div className="flex gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#7fa8a0]">Total Sales</div>
            <div className="text-xl font-bold text-[#f3f5f2]">₨ {totalSalesValue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#7fa8a0]">Inventory</div>
            <div className="text-xl font-bold text-[#f3f5f2]">{totalUnits.toLocaleString()} units</div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Imports" value={String(importsCount ?? 0)} icon={Ship} tone="teal" />
        <KpiCard
          label="Inventory On Hand"
          value={`${totalUnits.toLocaleString()} units`}
          icon={Package}
          tone="ink"
        />
        <KpiCard
          label="Government Sales"
          value={`₨ ${totalSalesValue.toLocaleString()}`}
          icon={Landmark}
          tone="brass"
        />
        <KpiCard
          label="Low Stock Alerts"
          value={String(lowStockCount)}
          delta={lowStockCount > 0 ? "Below 200 units" : undefined}
          icon={AlertTriangle}
          warn={lowStockCount > 0}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-card p-5 lg:col-span-2">
          <div className="mb-1 font-display text-[14px] font-semibold text-ink">Sales Trend</div>
          <div className="mb-4 text-[12px] text-muted">Government sales by month</div>
          <SalesTrendChart data={monthlyTrend} />
        </div>

        <div className="rounded-xl border border-line bg-card p-5">
          <div className="mb-1 font-display text-[14px] font-semibold text-ink">Stock Health</div>
          <div className="mb-4 text-[12px] text-muted">Inventory items by stock level</div>
          <InventoryDonutChart healthy={healthyStockCount} low={lowStockCount} />
        </div>
      </div>
    </div>
  );
}