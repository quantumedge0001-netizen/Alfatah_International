"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createPrivateSale } from "@/lib/actions/private-sales";

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

export default function PrivateSalesForm({
  companies,
  products,
}: {
  companies: { id: string; name: string; city: string | null }[];
  products: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<{ error: string | null }, FormData>(
    createPrivateSale,
    { error: null }
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-card p-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Private company">
          <select name="company_id" required className="input">
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.city ? ` — ${c.city}` : ""}
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
          <input name="quantity_sold" type="number" min="1" required className="input" />
        </Field>
        <Field label="Unit price">
          <input name="unit_price" type="number" min="0" step="0.01" required className="input" />
        </Field>
        <Field label="Sale date">
          <input name="sale_date" type="date" required className="input" />
        </Field>
        <Field label="Delivery status">
          <select name="delivery_status" required defaultValue="pending" className="input">
            <option value="pending">Pending</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
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
