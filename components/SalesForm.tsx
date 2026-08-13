"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createSale, updateSale } from "@/lib/actions/sales";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink2 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

interface ExistingSale {
  institution_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  sale_date: string;
  status: string;
}

export default function SalesForm({
  institutions,
  products,
  sale,
  saleId,
}: {
  institutions: { id: string; name: string; district: string }[];
  products: { id: string; name: string }[];
  sale?: ExistingSale;
  saleId?: string;
}) {
  const action = saleId ? updateSale.bind(null, saleId) : createSale;
  const [state, formAction] = useActionState<{ error: string | null }, FormData>(action, { error: null });

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-card p-6">
      {saleId && (
        <p className="rounded-md bg-[#072F5F]/[0.05] px-3 py-2 text-[12px] text-[#072F5F]">
          Yahan correction karne se iski invoice aur delivery challan bhi automatically update ho jayenge.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Government institution">
          <select name="institution_id" required defaultValue={sale?.institution_id ?? ""} className="input">
            <option value="">Select institution</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} — {i.district}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Product">
          <select name="product_id" required defaultValue={sale?.product_id ?? ""} className="input">
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quantity sold">
          <input
            name="quantity"
            type="number"
            min="1"
            required
            defaultValue={sale?.quantity}
            className="input"
          />
        </Field>
        <Field label="Unit price">
          <input
            name="unit_price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={sale?.unit_price}
            className="input"
          />
        </Field>
        <Field label="Sale date">
          <input name="sale_date" type="date" required defaultValue={sale?.sale_date} className="input" />
        </Field>
        <Field label="Delivery status">
          <select name="status" required defaultValue={sale?.status ?? "pending"} className="input">
            <option value="pending">Pending</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
          </select>
        </Field>
      </div>

      {state?.error && <p className="rounded-md bg-[#f3e0dd] px-3 py-2 text-xs text-stamp">{state.error}</p>}

      <SubmitButton label={saleId ? "Update Sale" : "Save Sale"} />

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
