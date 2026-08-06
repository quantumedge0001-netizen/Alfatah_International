import Link from "next/link";
import type { Profile } from "@/lib/types";
import { signOut } from "@/lib/actions/auth";

const ROLE_LABEL: Record<Profile["role"], string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  user: "User",
};

export default function Sidebar({ profile, regionName }: { profile: Profile; regionName?: string }) {
  const initials = ROLE_LABEL[profile.role]
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-shrink-0 flex-col bg-gradient-to-b from-ink to-ink2 px-5 py-6 text-[#dbe6e4]">
      <div className="mb-9">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-[#7fa8a0] font-display text-base font-bold text-[#f3f5f2]">
          M
        </div>
        <div className="font-display text-base font-bold tracking-tight text-[#f3f5f2]">Membrane Mart</div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-[#7fa8a0]">
          Import &amp; Gov. Sales
        </div>
      </div>

      <nav className="flex-1 space-y-0.5">
        <NavLink href="/dashboard" label="Dashboard" />
        <NavLink href="/imports" label="Import Register" />
        <NavLink href="/inventory" label="Inventory" />
        <NavLink href="/sales" label="Government Sales" />

        {profile.role !== "user" && (
          <>
            <div className="mb-2 mt-4 px-3 font-mono text-[10px] uppercase tracking-widest text-[#5c7570]">
              Administration
            </div>
            <NavLink href="/admin/users" label="Users" />
            <NavLink href="/admin/institutions" label="Institutions" />
          </>
        )}
        {profile.role === "super_admin" && <NavLink href="/admin/regions" label="Regions &amp; Admins" />}
      </nav>

      <div className="border-t border-white/10 pt-4">
        <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-dashed border-[#7fa8a0]/50 bg-white/5 px-2.5 py-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-brass font-mono text-[10px] font-semibold text-brass">
            {initials}
          </div>
          <div className="leading-tight">
            <div className="text-[11.5px] font-semibold text-[#f3f5f2]">{profile.full_name}</div>
            <div className="font-mono text-[9.5px] tracking-wide text-[#8fb0aa]">
              {profile.role === "super_admin" ? "GLOBAL · ALL REGIONS" : (regionName || "REGION UNASSIGNED").toUpperCase()}
            </div>
          </div>
        </div>
        <form action={signOut}>
          <button className="w-full rounded-md border border-white/10 px-3 py-2 text-left text-[11.5px] text-[#b7c8c5] hover:bg-white/5">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13.5px] font-medium text-[#b7c8c5] hover:bg-white/5 hover:text-white"
    >
      <span className="h-[5px] w-[5px] flex-shrink-0 rounded-full bg-[#5c7570]" />
      {label}
    </Link>
  );
}
