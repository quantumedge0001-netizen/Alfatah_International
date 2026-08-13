import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function InvoicesPage() {
  const supabase = (await createClient()) as any;
  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, invoice_no, customer_name, invoice_date, grand_total, status, invoice_items(sale_id, private_sale_id), challans(id)"
    )
    .order("invoice_date", { ascending: false })
    .limit(50);

  // An invoice is "From Sale" if any of its line items were pulled in from
  // an existing Government/Private sale record rather than typed by hand.
  function isFromSale(row: any) {
    return (row.invoice_items ?? []).some((i: any) => i.sale_id || i.private_sale_id);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-[#072F5F]">Invoice / Challan</h1>
          <p className="mt-0.5 text-[13px] text-muted">
            Generate PDF invoices on the Al-Fatah letterhead — replaces the old MS Word workflow
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="rounded-lg bg-[#072F5F] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a3d7a]"
        >
          + New Invoice
        </Link>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#072F5F]/15 text-left font-mono text-[10px] uppercase tracking-wider text-[#072F5F]/60">
              <th className="pb-2.5 pr-2">Invoice No</th>
              <th className="pb-2.5 pr-2">Customer</th>
              <th className="pb-2.5 pr-2">Date</th>
              <th className="pb-2.5 pr-2">Total</th>
              <th className="pb-2.5 pr-2">Source</th>
              <th className="pb-2.5 pr-2">Status</th>
              <th className="pb-2.5 pr-2"></th>
            </tr>
          </thead>
          <tbody>
            {(invoices ?? []).map((row: any) => (
              <tr key={row.id} className="border-b border-paper text-[12.5px] last:border-0 hover:bg-[#072F5F]/[0.02]">
                <td className="py-2.5 pr-2 font-mono font-medium text-ink">
                  <Link href={`/invoices/${row.id}`} className="hover:underline">
                    {row.invoice_no}
                  </Link>
                </td>
                <td className="py-2.5 pr-2">{row.customer_name}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{row.invoice_date}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">₨ {Number(row.grand_total).toLocaleString()}</td>
                <td className="py-2.5 pr-2">
                  {isFromSale(row) ? (
                    <span className="rounded-full bg-[#e6f7fc] px-2 py-0.5 text-[10.5px] font-medium text-[#072F5F]">
                      From Sale
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#eef0f4] px-2 py-0.5 text-[10.5px] font-medium text-muted">
                      Manual
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-2">
                  <span className={`status-pill ${row.status}`}>{row.status}</span>
                </td>
                <td className="py-2.5 pr-2 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <a
                      href={`/api/invoices/${row.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-line px-2.5 py-1 text-[11.5px] text-[#072F5F] hover:bg-[#072F5F]/[0.05]"
                    >
                      Invoice
                    </a>
                    {row.challans && row.challans.length > 0 && (
                      <a
                        href={`/api/challans/${row.challans[0].id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-line px-2.5 py-1 text-[11.5px] text-[#072F5F] hover:bg-[#072F5F]/[0.05]"
                      >
                        Challan
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(!invoices || invoices.length === 0) && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[13px] text-muted">
                  No invoices yet. Click "+ New Invoice" to create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
