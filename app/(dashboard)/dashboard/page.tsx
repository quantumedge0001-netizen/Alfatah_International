import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Package, Ship, Landmark, AlertTriangle } from "lucide-react";
import KpiCard from "@/components/KpiCard";
import SalesTrendChart from "@/components/charts/SalesTrendChart";
import InventoryDonutChart from "@/components/charts/InventoryDonutChart";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    profile,
    { count: importsCount },
    { data: inventoryRows },
    { data: salesRows },
  ] = await Promise.all([
    requireProfile(),
    supabase.from("imports").select("*", { count: "exact", head: true }),
    supabase.from("inventory").select("quantity_available"),
    supabase
      .from("sales")
      .select("total_price, created_at")
      .order("created_at", { ascending: true }),
  ]);

  const totalUnits = (inventoryRows ?? []).reduce((sum, r) => sum + (r.quantity_available ?? 0), 0);
  const totalSalesValue = (salesRows ?? []).reduce((sum, r) => sum + (r.total_price ?? 0), 0);
  const lowStockCount = (inventoryRows ?? []).filter((r) => (r.quantity_available ?? 0) < 200).length;
  const healthyStockCount = (inventoryRows ?? []).length - lowStockCount;

  const grouped = new Map<string, number>();
  for (const row of (salesRows ?? []) as { total_price: number; created_at: string }[]) {
    const label = new Date(row.created_at).toLocaleDateString("en-US", { month: "short" });
    grouped.set(label, (grouped.get(label) ?? 0) + (row.total_price ?? 0));
  }
  const monthlyTrend = Array.from(grouped, ([month, total]) => ({ month, total }));

  return (
   <div>
      {/* Hero / welcome card */}
      <div className="mb-6 flex flex-col justify-between gap-6 rounded-2xl border border-[#072F5F]/20 bg-gradient-to-br from-[#072F5F] to-[#0a3d7a] p-8 text-white shadow-lg shadow-[#072F5F]/10 sm:flex-row sm:items-center">
        <div>
          <div className="text-[13px] font-medium uppercase tracking-widest text-[#58CCED]">Welcome back</div>
          <h1 className="mt-1.5 font-display text-[28px] font-bold tracking-tight text-white">
            {profile.full_name}
          </h1>
          <p className="mt-2 text-[14px] text-white/70">
            {profile.role === "super_admin" ? "Consolidated view — all regions combined" : "Scoped to your assigned region"}
          </p>
        </div>
        <div className="flex gap-8">
          <div>
            <div className="text-[11.5px] font-medium uppercase tracking-widest text-[#58CCED]">Total Sales</div>
            <div className="mt-1.5 text-[28px] font-bold tracking-tight text-white">₨ {totalSalesValue.toLocaleString()}</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-[11.5px] font-medium uppercase tracking-widest text-[#58CCED]">Inventory</div>
            <div className="mt-1.5 text-[28px] font-bold tracking-tight text-white">{totalUnits.toLocaleString()} units</div>
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
          <div className="mb-1 font-display text-[14px] font-semibold text-[#072F5F]">Sales Trend</div>
          <div className="mb-4 text-[12px] text-muted">Government sales by month</div>
          <SalesTrendChart data={monthlyTrend} />
        </div>

        <div className="rounded-xl border border-line bg-card p-5">
          <div className="mb-1 font-display text-[14px] font-semibold text-[#072F5F]">Stock Health</div>
          <div className="mb-4 text-[12px] text-muted">Inventory items by stock level</div>
          <InventoryDonutChart healthy={healthyStockCount} low={lowStockCount} />
        </div>
      </div>
    </div>
  );
}