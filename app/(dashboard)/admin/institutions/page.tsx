import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import InstitutionForm from "@/components/InstitutionForm";

export default async function InstitutionsPage() {
  const supabase = await createClient();
  const { data: institutions } = await supabase
    .from("government_institutions")
    .select("id, name, district, contact_info")
    .order("district");

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Government Institutions"
        subtitle="Buyers across Jamshoro, Tharparkar, Umerkot, Islamkot, and Mithi"
      />

      <InstitutionForm />

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-muted">
              <th className="pb-2.5 pr-2">Institution</th>
              <th className="pb-2.5 pr-2">District</th>
              <th className="pb-2.5 pr-2">Contact</th>
            </tr>
          </thead>
          <tbody>
            {(institutions ?? []).map((i) => (
              <tr key={i.id} className="border-b border-paper text-[12.5px] last:border-0">
                <td className="py-2.5 pr-2">{i.name}</td>
                <td className="py-2.5 pr-2">{i.district}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{i.contact_info ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
