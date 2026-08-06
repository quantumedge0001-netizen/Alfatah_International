"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createImport } from "@/lib/actions/imports";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink2 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save Import"}
    </button>
  );
}

export default function ImportForm({ products }: { products: { id: string; name: string }[] }) {
  const [state, formAction] = useFormState(createImport, { error: null });

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-card p-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Product / Membrane type">
          <select name="product_id" required className="input">
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Supplier / vendor name">
          <input name="supplier" required className="input" placeholder="e.g. Hangzhou Filtec" />
        </Field>
        <Field label="Country of origin">
          <input name="country" required className="input" placeholder="e.g. CN" />
        </Field>
        <Field label="Quantity">
          <input name="quantity" type="number" min="1" required className="input" />
        </Field>
        <Field label="Unit cost">
          <input name="unit_cost" type="number" min="0" step="0.01" required className="input" />
        </Field>
        <Field label="Currency">
          <input name="currency" defaultValue="PKR" required className="input" />
        </Field>
        <Field label="Invoice / Bill of Lading #">
          <input name="invoice_no" className="input" />
        </Field>
        <Field label="Import date">
          <input name="import_date" type="date" required className="input" />
        </Field>
        <Field label="Expected arrival">
          <input name="expected_arrival" type="date" className="input" />
        </Field>
      </div>

      {state?.error && <p className="rounded-md bg-[#f3e0dd] px-3 py-2 text-xs text-stamp">{state.error}</p>}

      <SubmitButton />

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
