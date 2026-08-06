import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function UsersPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  // RLS already scopes this to the caller's own region for Admins.
  let query = supabase.from("profiles").select("id, full_name, email, role, status, regions(name)").order("full_name");

  const { data: users } = await query;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink">Users</h1>
        <p className="mt-0.5 text-[13px] text-muted">
          {profile.role === "super_admin" ? "All accounts, all regions" : "Accounts within your region"}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-muted">
              <th className="pb-2.5 pr-2">Name</th>
              <th className="pb-2.5 pr-2">Email</th>
              <th className="pb-2.5 pr-2">Role</th>
              <th className="pb-2.5 pr-2">Region</th>
              <th className="pb-2.5 pr-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u: any) => (
              <tr key={u.id} className="border-b border-paper text-[12.5px] last:border-0">
                <td className="py-2.5 pr-2">{u.full_name}</td>
                <td className="py-2.5 pr-2 font-mono text-muted">{u.email}</td>
                <td className="py-2.5 pr-2 capitalize">{u.role.replace("_", " ")}</td>
                <td className="py-2.5 pr-2">{u.regions?.name ?? "—"}</td>
                <td className="py-2.5 pr-2">
                  <span className={`status-pill ${u.status === "active" ? "delivered" : "review"}`}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
