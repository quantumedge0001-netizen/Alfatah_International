import { createClient } from "@/lib/supabase/server";
import SalesForm from "@/components/SalesForm";

export default async function NewSalePage() {
  const supabase = createClient();
  const [{ data: institutions }, { data: products }] = await Promise.all([
    supabase.from("government_institutions").select("id, name, district").order("name"),
    supabase.from("products").select("id, name").order("name"),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 font-display text-xl font-semibold text-ink">New Government Sale</h1>
      <p className="mb-6 text-[13px] text-muted">Automatically deducts from your region's inventory.</p>
      <SalesForm institutions={institutions ?? []} products={products ?? []} />
    </div>
  );
}
