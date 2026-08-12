import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Package, Ship, Landmark, AlertTriangle, FileText } from "lucide-react";
import KpiCard from "@/components/KpiCard";
import SalesTrendChart from "@/components/charts/SalesTrendChart";
import InventoryDonutChart from "@/components/charts/InventoryDonutChart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const supabaseAny = supabase as any; // invoices isn't in the generated Database type yet

  const [
    profile,
    { count: importsCount },
    { data: inventoryRows },
    { data: salesRows },
    { data: invoiceRows },
  ] = await Promise.all([
    requireProfile(),
    supabase.from("imports").select("*", { count: "exact", head: true }),
    supabase.from("inventory").select("quantity_available"),
    supabase
      .from("sales")
      .select("total_price, created_at")
      .order("created_at", { ascending: true }),
    supabaseAny
      .from("invoices")
      .select("id, invoice_no, customer_name, customer_type, grand_total, status, invoice_date")
      .order("invoice_date", { ascending: false }),
  ]);

  const invoices = invoiceRows ?? [];
  const totalInvoicedAmount = invoices.reduce((sum: number, r: any) => sum + Number(r.grand_total), 0);
  const governmentInvoiced = invoices
    .filter((r: any) => r.customer_type === "government_institution")
    .reduce((sum: number, r: any) => sum + Number(r.grand_total), 0);
  const privateInvoiced = invoices
    .filter((r: any) => r.customer_type !== "government_institution")
    .reduce((sum: number, r: any) => sum + Number(r.grand_total), 0);
  const recentInvoices = invoices.slice(0, 5);

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
        <KpiCard
          label="Invoiced Amount"
          value={`₨ ${totalInvoicedAmount.toLocaleString()}`}
          delta={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`}
          icon={FileText}
          tone="teal"
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

      {/* Invoices: sector split + recent list */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-card p-5">
          <div className="mb-1 font-display text-[14px] font-semibold text-[#072F5F]">Invoiced by Sector</div>
          <div className="mb-4 text-[12px] text-muted">Government vs private customers</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-[#e8eef7] px-3 py-2.5">
              <span className="text-[12.5px] font-medium text-[#072F5F]">Government</span>
              <span className="font-mono text-[13px] font-semibold text-[#072F5F]">
                ₨ {governmentInvoiced.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#e6f7fc] px-3 py-2.5">
              <span className="text-[12.5px] font-medium text-[#072F5F]">Private</span>
              <span className="font-mono text-[13px] font-semibold text-[#072F5F]">
                ₨ {privateInvoiced.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-display text-[14px] font-semibold text-[#072F5F]">Recent Invoices</div>
              <div className="text-[12px] text-muted">Latest invoices across all customers</div>
            </div>
            <Link href="/invoices" className="text-[12.5px] font-medium text-[#072F5F] hover:underline">
              View all
            </Link>
          </div>
          <table className="w-full border-collapse">
            <tbody>
              {recentInvoices.map((row: any) => (
                <tr key={row.id} className="border-b border-paper text-[12.5px] last:border-0">
                  <td className="py-2 pr-2 font-mono font-medium text-ink">
                    <Link href={`/invoices/${row.id}`} className="hover:underline">
                      {row.invoice_no}
                    </Link>
                  </td>
                  <td className="py-2 pr-2">{row.customer_name}</td>
                  <td className="py-2 pr-2 font-mono text-muted">₨ {Number(row.grand_total).toLocaleString()}</td>
                  <td className="py-2 pr-2">
                    <span className={`status-pill ${row.status}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
              {recentInvoices.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-[13px] text-muted">No invoices yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}