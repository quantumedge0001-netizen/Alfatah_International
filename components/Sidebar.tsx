"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Inbox,
  Ship,
  Boxes,
  Landmark,
  Users,
  Building2,
  Briefcase,
  MapPin,
  ChevronsLeft,
  ChevronsRight,
  Camera,
  FileText,
  CalendarCheck,
  Wallet,
  PieChart,
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { signOut } from "@/lib/actions/auth";

const ROLE_LABEL: Record<Profile["role"], string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  user: "User",
};

export default function Sidebar({ profile, regionName }: { profile: Profile; regionName?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  const initials = ROLE_LABEL[profile.role]
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-shrink-0 flex-col bg-[#072F5F] px-3 py-6 text-white transition-[width] duration-300 ${
        collapsed ? "w-[72px]" : "w-53"
      }`}
    >
      {/* Toggle button - sidebar ke top-right border par floating */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-4 top-7 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-[#58CCED]/40 bg-[#072F5F] text-[#58CCED] shadow-md shadow-black/30 transition-colors hover:bg-[#0a3d7a]"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
      </button>

      <div className={`mb-9 flex-shrink-0 ${collapsed ? "px-0" : "px-2"}`}>
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-[#58CCED] font-display text-base font-bold text-white">
          M
        </div>
        {!collapsed && (
          <>
            <div className="font-display text-base font-bold tracking-tight text-white">Membrane Mart</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-[#58CCED]">
              CRM & Inventory
            </div>
          </>
        )}
      </div>

      {/* Scrollable nav area */}
      <nav
        className="sidebar-scroll flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden pr-1"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#58CCED transparent",
        }}
      >
        <NavLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} collapsed={collapsed} />
        <NavLink href="/leads" label="Leads" icon={Inbox} collapsed={collapsed} />
        <NavLink href="/imports" label="Import Register" icon={Ship} collapsed={collapsed} />
        <NavLink href="/inventory" label="Inventory" icon={Boxes} collapsed={collapsed} />
        <NavLink href="/sales" label="Government Sales" icon={Landmark} collapsed={collapsed} />
        <NavLink href="/private-sales" label="Private Sales" icon={Briefcase} collapsed={collapsed} />
        <NavLink href="/invoices" label="Invoice / Challan" icon={FileText} collapsed={collapsed} />
        <NavLink href="/camera-agent" label="Camera Agent" icon={Camera} collapsed={collapsed} />
        <NavLink href="/attendance" label="Attendance" icon={CalendarCheck} collapsed={collapsed} />
        <NavLink href="/salary" label="Salary" icon={Wallet} collapsed={collapsed} />
        <NavLink href="/finance" label="Finance" icon={PieChart} collapsed={collapsed} />

        {profile.role !== "user" && (
          <>
            {!collapsed && (
              <div className="mb-2 mt-4 px-3 font-mono text-[10px] uppercase tracking-widest text-[#58CCED]/70">
                Administration
              </div>
            )}
            {collapsed && <div className="my-3 border-t border-white/10" />}
            <NavLink href="/admin/users" label="Users" icon={Users} collapsed={collapsed} />
            <NavLink href="/admin/institutions" label="Institutions" icon={Building2} collapsed={collapsed} />
            <NavLink href="/admin/private-companies" label="Private Companies" icon={Briefcase} collapsed={collapsed} />
          </>
        )}
        {profile.role === "super_admin" && (
          <NavLink href="/admin/regions" label="Regions &amp; Admins" icon={MapPin} collapsed={collapsed} />
        )}
      </nav>

      <div className="flex-shrink-0 border-t border-white/10 pt-4">
        <div
          className={`mb-3 flex items-center gap-2.5 rounded-lg border border-dashed border-[#58CCED]/50 bg-white/5 px-2.5 py-2 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#58CCED] font-mono text-[10px] font-semibold text-[#58CCED]">
            {initials}
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-[11.5px] font-semibold text-white">{profile.full_name}</div>
              <div className="font-mono text-[9.5px] tracking-wide text-[#58CCED]">
                {profile.role === "super_admin" ? "GLOBAL · ALL REGIONS" : (regionName || "REGION UNASSIGNED").toUpperCase()}
              </div>
            </div>
          )}
        </div>
        <form action={signOut}>
          <button
            className={`w-full rounded-md border border-white/10 py-2 text-[11.5px] text-white/80 hover:bg-white/5 ${
              collapsed ? "px-0" : "px-3 text-left"
            }`}
          >
            {collapsed ? "⏻" : "Sign out"}
          </button>
        </form>
      </div>

      {/* Thin webkit scrollbar for the nav */}
      <style jsx global>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background-color: #58CCED;
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #7fd9f5;
        }
      `}</style>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-2.5 rounded-md py-2.5 text-[13.5px] font-medium text-white/70 hover:bg-white/10 hover:text-white ${
        collapsed ? "justify-center px-0" : "px-3"
      }`}
    >
      <Icon size={17} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}