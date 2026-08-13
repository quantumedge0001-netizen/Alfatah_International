import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Mail, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import InvoiceActions from "@/components/invoices/InvoiceActions";
import ChallanSection from "@/components/challans/ChallanSection";
import { COMPANY_INFO } from "@/lib/invoices/constants";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = (await createClient()) as any;

  const [{ data: invoice }, { data: challans }] = await Promise.all([
    supabase.from("invoices").select("*, invoice_items(*)").eq("id", id).single(),
    supabase.from("challans").select("*").eq("invoice_id", id).order("created_at", { ascending: false }),
  ]);

  if (!invoice) notFound();

  const items = (invoice.invoice_items ?? []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order);
  const isFromSale = items.some((i: any) => i.sale_id || i.private_sale_id);

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-[#072F5F]">{invoice.invoice_no}</h1>
          <p className="mt-0.5 text-[13px] text-muted">
            {invoice.customer_name} — {invoice.invoice_date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-[#072F5F] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0a3d7a]"
          >
            Invoice
          </a>
          {challans && challans.length > 0 && (
            <a
              href={`/api/challans/${challans[0].id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-[#072F5F] px-4 py-2 text-[13px] font-medium text-[#072F5F] hover:bg-[#072F5F]/[0.05]"
            >
              Challan
            </a>
          )}
          <Link href="/invoices" className="rounded-lg border border-line px-4 py-2 text-[13px] text-ink hover:bg-[#072F5F]/[0.05]">
            Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
      {/* Same visual language as the downloaded PDF — navy header, bill-to
          card, navy table header, navy total bar, signer block with icons —
          so the on-screen preview and the PDF read as the same document. */}
      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line bg-[#072F5F]/[0.03] px-6 py-4">
          <div className="flex items-center gap-2">
            <span className={`status-pill ${invoice.status}`}>{invoice.status}</span>
            {isFromSale ? (
              <span className="rounded-full bg-[#e6f7fc] px-2 py-0.5 text-[10.5px] font-medium text-[#072F5F]">
                From Sale
              </span>
            ) : (
              <span className="rounded-full bg-[#eef0f4] px-2 py-0.5 text-[10.5px] font-medium text-muted">
                Manual
              </span>
            )}
          </div>
          <InvoiceActions id={invoice.id} status={invoice.status} />
        </div>

        <div className="p-6">
          <div className="mb-5">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">Invoice To</div>
            <div className="text-[12.5px] text-muted">To,</div>
            <div className="text-[12.5px] text-muted">The Management,</div>
            <div className="mt-0.5 text-[14px] font-semibold text-[#072F5F]">{invoice.customer_name}</div>
            {invoice.customer_address && (
              <div className="mt-0.5 text-[12.5px] text-muted">{invoice.customer_address}</div>
            )}
          </div>

          <table className="w-full border-collapse overflow-hidden rounded-lg">
            <thead>
              <tr className="bg-[#072F5F] text-left text-[10px] font-semibold uppercase tracking-wider text-white">
                <th className="px-3 py-2.5">Description</th>
                <th className="px-3 py-2.5">UOM</th>
                <th className="px-3 py-2.5">Qty</th>
                <th className="px-3 py-2.5 text-right">Unit Price</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => (
                <tr key={item.id} className={`text-[12.5px] ${index % 2 === 1 ? "bg-[#f7f9fb]" : ""}`}>
                  <td className="px-3 py-2.5 border-t border-line">{item.description}</td>
                  <td className="px-3 py-2.5 border-t border-line">{item.uom}</td>
                  <td className="px-3 py-2.5 border-t border-line font-mono">{item.quantity}</td>
                  <td className="px-3 py-2.5 border-t border-line text-right font-mono">
                    ₨ {Number(item.unit_price).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 border-t border-line text-right font-mono">
                    ₨ {Number(item.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex items-center justify-end rounded-lg bg-[#072F5F] px-4 py-3">
            <span className="mr-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#58CCED]">
              Grand Total
            </span>
            <span className="text-[17px] font-bold text-white">
              Rs. {Number(invoice.grand_total).toLocaleString()}/-
            </span>
          </div>

          <div className="mt-6">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">Payment Method</div>
            <div className="text-[13px] text-ink">{invoice.payment_method}</div>
            {invoice.notes && (
              <>
                <div className="mb-1 mt-3 font-mono text-[10px] uppercase tracking-wider text-muted">Notes</div>
                <div className="text-[13px] text-ink">{invoice.notes}</div>
              </>
            )}

            <div className="mt-4 text-[12.5px]">
              <div className="text-muted">Warm Regards,</div>
              <div className="mt-0.5 font-semibold text-[#072F5F]">{COMPANY_INFO.signerName}</div>
              <div className="text-muted">{COMPANY_INFO.signerTitle}</div>
              <div className="mb-2 font-semibold text-ink">{COMPANY_INFO.companyName}</div>

              <div className="flex items-center gap-2 text-muted">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366]">
                  <Phone size={11} className="text-white" />
                </span>
                {COMPANY_INFO.phone}
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-muted">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#072F5F]">
                  <Mail size={11} className="text-white" />
                </span>
                {COMPANY_INFO.email}
              </div>
              <div className="mt-1.5 flex items-start gap-2 text-muted">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#072F5F]">
                  <MapPin size={11} className="text-white" />
                </span>
                {COMPANY_INFO.address}
              </div>
            </div>

            <div className="mb-1 mt-5 font-mono text-[10px] uppercase tracking-wider text-[#072F5F]">
              Authorized Signature &amp; Stamp
            </div>
            <div className="h-14 w-48 rounded-md border border-dashed border-line" />
          </div>
        </div>
      </div>
      </div>

      <div className="lg:col-span-1">
        <ChallanSection invoiceId={invoice.id} challans={challans ?? []} />
      </div>
      </div>
    </div>
  );
}
