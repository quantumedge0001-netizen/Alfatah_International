import Link from "next/link";
import { createClient } from "@/lib/supabase/server"; // ⚠️ adjust to your actual client path

export default async function PrivateSalesPage() {
  const supabase = await createClient();

  const { data: sales } = await supabase
    .from("private_sales")
    .select(
      "id, quantity_sold, unit_price, sale_date, delivery_status, private_companies(name, city), products(name)"
    )
    .order("sale_date", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Private Company Sales</h1>
        <Link
          href="/private-sales/new"
          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          + New Sale
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Unit Price</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(sales ?? []).map((s: any) => (
              <tr key={s.id} className="border-t border-black/5">
                <td className="px-4 py-3">
                  {s.private_companies?.name}{" "}
                  <span className="text-gray-400">({s.private_companies?.city})</span>
                </td>
                <td className="px-4 py-3">{s.products?.name}</td>
                <td className="px-4 py-3">{s.quantity_sold}</td>
                <td className="px-4 py-3">{s.unit_price}</td>
                <td className="px-4 py-3">{s.sale_date}</td>
                <td className="px-4 py-3 capitalize">{s.delivery_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
