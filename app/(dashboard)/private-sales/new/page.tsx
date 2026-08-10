import { createClient } from "@/lib/supabase/server";
import PrivateSalesForm from "@/components/PrivateSalesForm";

export default async function NewPrivateSalePage() {
  const supabase = await createClient();
  const [{ data: companies }, { data: products }] = await Promise.all([
    supabase.from("private_companies").select("id, name, city").order("name"),
    supabase.from("products").select("id, name").order("name"),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 font-display text-xl font-semibold text-ink">New Private Sale</h1>
      <p className="mb-6 text-[13px] text-muted">
        Doesn't affect regional inventory automatically — private_sales has no inventory trigger yet.
      </p>
      <PrivateSalesForm companies={companies ?? []} products={products ?? []} />
    </div>
  );
}
