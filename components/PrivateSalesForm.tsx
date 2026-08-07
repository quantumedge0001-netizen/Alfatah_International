"use client";

import { useState } from "react";
import { createPrivateSale } from "@/lib/actions/privateSales";

type Company = { id: string; name: string; city?: string | null };
type Product = { id: string; name: string };

export default function PrivateSalesForm({
  companies,
  products,
}: {
  companies: Company[];
  products: Product[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createPrivateSale(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <form action={handleSubmit} className="rounded-xl border border-black/5 bg-white p-8 shadow-sm">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Private company
          </label>
          <select
            name="company_id"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.city ? ` — ${c.city}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Product</label>
          <select
            name="product_id"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Quantity sold</label>
          <input
            type="number"
            name="quantity_sold"
            min={1}
            step="any"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Unit price</label>
          <input
            type="number"
            name="unit_price"
            min={0}
            step="any"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Sale date</label>
          <input
            type="date"
            name="sale_date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Delivery status</label>
          <select
            name="delivery_status"
            defaultValue="pending"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Sale"}
      </button>
    </form>
  );
}
