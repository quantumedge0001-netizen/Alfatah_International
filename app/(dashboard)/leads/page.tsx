import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import LeadRowActions from "@/components/LeadRowActions";

export default async function LeadsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: leads }, { data: assignableUsers }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, name, phone, email, source, requirement, status, assigned_to, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  const newCount = (leads ?? []).filter((l) => l.status === "new").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-[#072F5F]">Leads</h1>
          <p className="mt-0.5 text-[13px] text-muted">
            {newCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-[#072F5F]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#58CCED]" />
                {newCount} new lead{newCount === 1 ? "" : "s"} awaiting follow-up
              </span>
            ) : (
              "All caught up"
            )}
            {" · "}Meta Lead Ads (more sources coming: Google Sheets, website)
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#072F5F]/15 text-left font-mono text-[10px] uppercase tracking-wider text-[#072F5F]/60">
              <th className="pb-2.5 pr-2">Name</th>
              <th className="pb-2.5 pr-2">Contact</th>
              <th className="pb-2.5 pr-2">Source</th>
              <th className="pb-2.5 pr-2">Requirement</th>
              <th className="pb-2.5 pr-2">Status / Assigned</th>
              <th className="pb-2.5 pr-2">Received</th>
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map((lead) => (
              <tr key={lead.id} className="border-b border-paper text-[12.5px] last:border-0 hover:bg-[#072F5F]/[0.02]">
                <td className="py-2.5 pr-2 font-medium text-ink">{lead.name ?? "—"}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">
                  {lead.phone ?? lead.email ?? "—"}
                </td>
                <td className="py-2.5 pr-2">
                  <span className="rounded-full bg-[#072F5F]/[0.06] px-2 py-0.5 text-[10.5px] capitalize text-[#072F5F]">
                    {lead.source}
                  </span>
                </td>
                <td className="max-w-[220px] truncate py-2.5 pr-2 text-muted" title={lead.requirement ?? ""}>
                  {lead.requirement ?? "—"}
                </td>
                <td className="py-2.5 pr-2">
                  <LeadRowActions
                    leadId={lead.id}
                    status={lead.status}
                    assignedTo={lead.assigned_to}
                    assignableUsers={assignableUsers ?? []}
                    canAssign={profile.role !== "user"}
                  />
                </td>
                <td className="py-2.5 pr-2 font-mono text-muted">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!leads || leads.length === 0) && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[13px] text-muted">
                  No leads yet — once the Meta webhook is registered, new leads will appear here automatically.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}