import { createClient } from "@/lib/supabase/server";
import ImportForm from "@/components/ImportForm";

export default async function NewImportPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("id, name").order("name");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 font-display text-xl font-semibold text-ink">New Import</h1>
      <p className="mb-6 text-[13px] text-muted">
        Recorded against your assigned region. Attachments (invoice, customs docs) can be added after saving.
      </p>
      <ImportForm products={products ?? []} />
    </div>
  );
}
