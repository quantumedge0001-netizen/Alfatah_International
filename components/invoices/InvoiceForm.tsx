"use client";

import { useState, useTransition } from "react";
import { createInvoice, getUninvoicedSales } from "@/lib/invoices/actions";
import type { InvoiceCustomerType, PaymentMethod, SourceableSale } from "@/lib/invoices/types";
import PaymentMethodSelect from "./PaymentMethodSelect";
import Select from "@/components/ui/Select";

const CUSTOMER_TYPE_OPTIONS: { value: InvoiceCustomerType; label: string }[] = [
  { value: "private_company", label: "Private Company" },
  { value: "government_institution", label: "Government Institution" },
  { value: "custom", label: "Custom (type manually)" },
];

interface Row {
  rowId: string;
  description: string;
  uom: string;
  quantity: string;
  unit_price: string;
  sale_id: string | null;
  private_sale_id: string | null;
}

function emptyRow(): Row {
  return {
    rowId: crypto.randomUUID(),
    description: "",
    uom: "",
    quantity: "",
    unit_price: "",
    sale_id: null,
    private_sale_id: null,
  };
}

export default function InvoiceForm({
  privateCompanies,
  institutions,
}: {
  privateCompanies: { id: string; name: string; city: string | null }[];
  institutions: { id: string; name: string; district: string }[];
}) {
  const [customerType, setCustomerType] = useState<InvoiceCustomerType>("private_company");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [notes, setNotes] = useState("");

  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [sourceSales, setSourceSales] = useState<SourceableSale[] | null>(null);
  const [loadingSales, setLoadingSales] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCustomerSelect(id: string) {
    setCustomerId(id);
    setSourceSales(null);
    if (customerType === "private_company") {
      const c = privateCompanies.find((c) => c.id === id);
      setCustomerName(c ? c.name : "");
    } else if (customerType === "government_institution") {
      const i = institutions.find((i) => i.id === id);
      setCustomerName(i ? i.name : "");
    }
  }

  async function loadSales() {
    if (!customerId) return;
    setLoadingSales(true);
    const sales = await getUninvoicedSales(customerType, customerId);
    setSourceSales(sales);
    setLoadingSales(false);
  }

  function addSaleAsRow(sale: SourceableSale) {
    setRows((prev) => [
      ...prev.filter((r) => r.description !== "" || r.quantity !== ""),
      {
        rowId: crypto.randomUUID(),
        description: sale.description,
        uom: sale.uom,
        quantity: String(sale.quantity),
        unit_price: String(sale.unit_price),
        sale_id: sale.source === "sale" ? sale.id : null,
        private_sale_id: sale.source === "private_sale" ? sale.id : null,
      },
    ]);
    setSourceSales((prev) => (prev ? prev.filter((s) => s.id !== sale.id) : prev));
  }

  function updateRow(rowId: string, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r)));
  }

  function removeRow(rowId: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  }

  const grandTotal = rows.reduce((sum, r) => {
    const qty = Number(r.quantity) || 0;
    const price = Number(r.unit_price) || 0;
    return sum + qty * price;
  }, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError("Customer name zaroori hai.");
      return;
    }
    const items = rows
      .filter((r) => r.description.trim() && Number(r.quantity) > 0)
      .map((r) => ({
        description: r.description.trim(),
        uom: r.uom.trim() || "Units",
        quantity: Number(r.quantity),
        unit_price: Number(r.unit_price) || 0,
        sale_id: r.sale_id,
        private_sale_id: r.private_sale_id,
      }));
    if (items.length === 0) {
      setError("Kam az kam ek item add karein.");
      return;
    }

    startTransition(async () => {
      const result = await createInvoice({
        customer_type: customerType,
        private_company_id: customerType === "private_company" ? customerId || null : null,
        institution_id: customerType === "government_institution" ? customerId || null : null,
        customer_name: customerName.trim(),
        customer_address: customerAddress.trim() || null,
        invoice_date: invoiceDate,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        items,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-line bg-card p-6">
      <SectionLabel>Invoice Details</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Customer type">
          <Select
            value={customerType}
            onChange={(v) => {
              setCustomerType(v as InvoiceCustomerType);
              setCustomerId("");
              setCustomerName("");
              setSourceSales(null);
            }}
            options={CUSTOMER_TYPE_OPTIONS}
          />
        </Field>

        {customerType === "private_company" && (
          <Field label="Company">
            <select className="input" value={customerId} onChange={(e) => handleCustomerSelect(e.target.value)}>
              <option value="">Select company</option>
              {privateCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.city ? ` — ${c.city}` : ""}
                </option>
              ))}
            </select>
          </Field>
        )}

        {customerType === "government_institution" && (
          <Field label="Institution">
            <select className="input" value={customerId} onChange={(e) => handleCustomerSelect(e.target.value)}>
              <option value="">Select institution</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} — {i.district}
                </option>
              ))}
            </select>
          </Field>
        )}

        {customerType === "custom" && (
          <Field label="Customer name">
            <input
              className="input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Glucorp Pvt Ltd"
            />
          </Field>
        )}

        <Field label="Customer address (invoice par print hoga)">
          <input
            className="input"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="e.g. G-10 Eastern Zone Port Qasim, Karachi."
          />
        </Field>

        <Field label="Invoice date">
          <input
            type="date"
            className="input"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            required
          />
        </Field>

        <Field label="Payment method">
          <PaymentMethodSelect value={paymentMethod} onChange={setPaymentMethod} />
        </Field>
      </div>

      {customerType !== "custom" && customerId && (
        <div className="rounded-lg border border-dashed border-line p-3">
          <button
            type="button"
            onClick={loadSales}
            disabled={loadingSales}
            className="rounded-md border border-line px-3 py-1.5 text-[12.5px] text-[#072F5F] hover:bg-[#072F5F]/[0.05]"
          >
            {loadingSales ? "Loading…" : "Load this customer's sales"}
          </button>
          {sourceSales && sourceSales.length === 0 && (
            <p className="mt-2 text-[12px] text-muted">No un-invoiced sales found for this customer.</p>
          )}
          {sourceSales && sourceSales.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {sourceSales.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md bg-[#072F5F]/[0.03] px-2.5 py-1.5 text-[12.5px]"
                >
                  <span>
                    {s.description} — {s.quantity} {s.uom} @ ₨{s.unit_price} ({s.sale_date})
                  </span>
                  <button
                    type="button"
                    onClick={() => addSaleAsRow(s)}
                    className="rounded-md bg-[#072F5F] px-2 py-1 text-[11px] text-white hover:bg-[#0a3d7a]"
                  >
                    + Add to invoice
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <SectionLabel>Items</SectionLabel>
        <div className="grid grid-cols-12 gap-2 px-0.5">
          <span className="col-span-3 text-[10.5px] font-medium text-muted">Description</span>
          <span className="col-span-2 text-[10.5px] font-medium text-muted">UOM</span>
          <span className="col-span-1 text-[10.5px] font-medium text-muted">Qty</span>
          <span className="col-span-2 text-[10.5px] font-medium text-muted">Unit Price</span>
          <span className="col-span-3 text-right text-[10.5px] font-medium text-muted">Amount</span>
          <span className="col-span-1" />
        </div>
        <div className="mt-1.5 space-y-2">
          {rows.map((row) => (
            <div key={row.rowId} className="grid grid-cols-12 items-center gap-2">
              <input
                className="input col-span-3"
                placeholder="e.g. Hydroscale 700"
                value={row.description}
                onChange={(e) => updateRow(row.rowId, "description", e.target.value)}
              />
              <input
                className="input col-span-2"
                placeholder="e.g. Kgs"
                value={row.uom}
                onChange={(e) => updateRow(row.rowId, "uom", e.target.value)}
              />
              <input
                className="input col-span-1"
                type="number"
                min="0"
                placeholder="0"
                value={row.quantity}
                onChange={(e) => updateRow(row.rowId, "quantity", e.target.value)}
              />
              <input
                className="input col-span-2"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={row.unit_price}
                onChange={(e) => updateRow(row.rowId, "unit_price", e.target.value)}
              />
              <div className="col-span-3 truncate text-right font-mono text-[12.5px] text-muted" title={`₨${((Number(row.quantity) || 0) * (Number(row.unit_price) || 0)).toLocaleString()}`}>
                ₨{((Number(row.quantity) || 0) * (Number(row.unit_price) || 0)).toLocaleString()}
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.rowId)}
                className="col-span-1 rounded-md border border-line py-2 text-[12px] text-stamp hover:bg-[#f3e0dd]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, emptyRow()])}
          className="mt-2 rounded-md border border-line px-3 py-1.5 text-[12.5px] text-[#072F5F] hover:bg-[#072F5F]/[0.05]"
        >
          + Add Item
        </button>
      </div>

      <SectionLabel>Payment &amp; Notes</SectionLabel>
      <Field label="Notes (optional)">
        <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <div className="flex items-center justify-between rounded-lg bg-[#072F5F]/[0.04] px-4 py-3">
        <span className="text-[15px] font-semibold text-[#072F5F]">
          Grand Total: ₨ {grandTotal.toLocaleString()}
        </span>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#072F5F] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0a3d7a] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Invoice"}
        </button>
      </div>

      {error && <p className="rounded-md bg-[#f3e0dd] px-3 py-2 text-xs text-stamp">{error}</p>}

      <style>{`.input { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: white; }`}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-line pb-2 font-mono text-[10.5px] font-semibold uppercase tracking-widest text-[#072F5F]">
      {children}
    </div>
  );
}
