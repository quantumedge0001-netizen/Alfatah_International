import { createClient } from "@/lib/supabase/server";
import InvoiceForm from "@/components/invoices/InvoiceForm";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const [{ data: privateCompanies }, { data: institutions }] = await Promise.all([
    supabase.from("private_companies").select("id, name, city").order("name"),
    supabase.from("government_institutions").select("id, name, district").order("name"),
  ]);

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 font-display text-xl font-semibold text-ink">New Invoice</h1>
      <p className="mb-6 text-[13px] text-muted">
        Pick a customer, pull in items from an existing sale or type them by hand, then download the
        PDF on the Al-Fatah letterhead.
      </p>
      <InvoiceForm privateCompanies={privateCompanies ?? []} institutions={institutions ?? []} />
    </div>
  );
}
