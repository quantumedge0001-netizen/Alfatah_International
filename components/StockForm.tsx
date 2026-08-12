"use client";

import { useActionState } from "react";
import { createStockItem } from "@/lib/actions/stock";

const initialState = { error: null as string | null };

export default function StockForm() {
  const [state, formAction, pending] = useActionState(createStockItem, initialState);

  return (
    <form action={formAction} className="max-w-2xl rounded-xl border border-line bg-card p-6">
      {state.error && (
        <div className="mb-4 rounded-lg bg-[#fdeceb] px-3 py-2 text-[13px] text-[#c0392b]">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[12.5px] font-medium text-ink">Item Description</label>
          <input
            name="item_description"
            required
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-[#072F5F]"
            placeholder="e.g. Membrane Filter Unit"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12.5px] font-medium text-ink">New / Refurbished</label>
          <select
            name="condition"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-[#072F5F]"
          >
            <option value="">Select</option>
            <option value="New">New</option>
            <option value="Refurbished">Refurbished</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[12.5px] font-medium text-ink">Origin / Make</label>
          <input
            name="origin_make"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-[#072F5F]"
            placeholder="e.g. China, Local"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12.5px] font-medium text-ink">Model / Type</label>
          <input
            name="model_type"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-[#072F5F]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12.5px] font-medium text-ink">Size / Capacity</label>
          <input
            name="size_capacity"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-[#072F5F]"
            placeholder="e.g. 50L, 10 meter"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12.5px] font-medium text-ink">Quantity</label>
          <input
            name="quantity"
            type="number"
            min={1}
            required
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-[#072F5F]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12.5px] font-medium text-ink">Unit Price (PKR)</label>
          <input
            name="unit_price"
            type="number"
            min={0}
            step="0.01"
            required
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-[#072F5F]"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#072F5F] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a3d7a] disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save Stock Item"}
        </button>
      </div>
    </form>
  );
}