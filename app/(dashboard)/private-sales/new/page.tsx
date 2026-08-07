import PrivateSalesForm from "@/components/PrivateSalesForm";
import { createClient } from "@/lib/supabase/server"; // ⚠️ adjust to your actual client path
import { getPrivateCompanies } from "@/lib/actions/privateSales";

export default async function NewPrivateSalePage() {
  const supabase = await createClient();

  const [{ data: products }, companies] = await Promise.all([
    supabase.from("products").select("id, name").order("name"),
    getPrivateCompanies(),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">New Private Company Sale</h1>
      <p className="mb-6 text-sm text-gray-500">
        Automatically deducts from your region&apos;s inventory.
      </p>
      <PrivateSalesForm companies={companies} products={products ?? []} />
    </div>
  );
}
