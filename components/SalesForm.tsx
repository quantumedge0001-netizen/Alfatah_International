"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createSale } from "@/lib/actions/sales";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink2 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save Sale"}
    </button>
  );
}

export default function SalesForm({
  institutions,
  products,
}: {
  institutions: { id: string; name: string; district: string }[];
  products: { id: string; name: string }[];
}) {
  const [state, formAction] = useFormState<{ error: string | null }, FormData>(
    createSale,
    { error: null }
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-card p-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Government institution">
          <select name="institution_id" required className="input">
            <option value="">Select institution</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} — {i.district}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Product">
          <select name="product_id" required className="input">
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quantity sold">
          <input name="quantity" type="number" min="1" required className="input" />
        </Field>
        <Field label="Unit price">
          <input name="unit_price" type="number" min="0" step="0.01" required className="input" />
        </Field>
        <Field label="Sale date">
          <input name="sale_date" type="date" required className="input" />
        </Field>
        <Field label="Delivery status">
          <select name="status" required defaultValue="pending" className="input">
            <option value="pending">Pending</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
          </select>
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
