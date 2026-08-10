import { createClient } from "@/lib/supabase/server";
import PrivateCompanyForm from "@/components/PrivateCompanyForm";

export default async function PrivateCompaniesPage() {
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("private_companies")
    .select("id, name, city, contact_info")
    .order("name");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink">Private Companies</h1>
        <p className="mt-0.5 text-[13px] text-muted">
          Textile, F&amp;B, pharma, dyeing, packaging, ice plants, hospitals, and other private buyers
        </p>
      </div>

      <PrivateCompanyForm />

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-muted">
              <th className="pb-2.5 pr-2">Company</th>
              <th className="pb-2.5 pr-2">City</th>
              <th className="pb-2.5 pr-2">Contact</th>
            </tr>
          </thead>
          <tbody>
            {(companies ?? []).map((c) => (
              <tr key={c.id} className="border-b border-paper text-[12.5px] last:border-0">
                <td className="py-2.5 pr-2">{c.name}</td>
                <td className="py-2.5 pr-2">{c.city ?? "—"}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{c.contact_info ?? "—"}</td>
              </tr>
            ))}
            {(!companies || companies.length === 0) && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-[13px] text-muted">
                  No private companies added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
