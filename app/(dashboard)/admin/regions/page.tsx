import { createClient } from "@/lib/supabase/server";

export default async function RegionsPage() {
  const supabase = createClient();
  const { data: regions } = await supabase
    .from("regions")
    .select("id, name, created_at, profiles(count)")
    .order("name");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink">Regions &amp; Admins</h1>
        <p className="mt-0.5 text-[13px] text-muted">Super Admin only · seeds the region_id every table filters on</p>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-muted">
              <th className="pb-2.5 pr-2">Region</th>
              <th className="pb-2.5 pr-2">Accounts</th>
              <th className="pb-2.5 pr-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {(regions ?? []).map((r: any) => (
              <tr key={r.id} className="border-b border-paper text-[12.5px] last:border-0">
                <td className="py-2.5 pr-2">{r.name}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{r.profiles?.[0]?.count ?? 0}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{r.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted">
        New Admin accounts should be created via Supabase Auth (invite by email), then linked to a region by
        setting <code className="rounded bg-white px-1 py-0.5 font-mono">profiles.region_id</code> and{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono">profiles.role = &apos;admin&apos;</code>.
      </p>
    </div>
  );
}
