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
      className={`sticky top-0 flex h-screen flex-shrink-0 flex-col bg-[#072F5F] px-2.5 py-5 text-white transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-[64px]" : "w-52"
      }`}
    >
      {/* Toggle button — aside ke bahar hai, isay overflow-hidden wrapper ke andar mat rakhna */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-6 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-[#58CCED]/40 bg-[#072F5F] text-[#58CCED] shadow-md shadow-black/30 transition-colors hover:bg-[#0a3d7a]"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronsRight size={13} /> : <ChevronsLeft size={13} />}
      </button>

      {/* Poora andar ka content — yahan overflow-hidden lagaya taake text collapse ke waqt overflow na ho */}
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className={`mb-6 flex-shrink-0 ${collapsed ? "px-0" : "px-1.5"}`}>
          <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg border border-[#58CCED]/40 bg-[#58CCED]/15 font-display text-sm font-bold text-[#58CCED]">
            M
          </div>
          <div
            className={`overflow-hidden transition-opacity duration-200 ${
              collapsed ? "h-0 opacity-0 duration-100" : "h-auto opacity-100 delay-100"
            }`}
          >
            <div className="whitespace-nowrap font-display text-[14px] font-bold tracking-tight text-white">
              Membrane Mart
            </div>
            <div className="mt-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/5 px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-widest text-[#58CCED]">
              <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[#58CCED]" />
              CRM &amp; Inventory
            </div>
          </div>
        </div>

        {/* Scrollable nav area */}
        <nav
          className="sidebar-scroll flex-1 space-y-0 overflow-y-auto overflow-x-hidden pr-0.5"
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
                <div className="mb-1.5 mt-3 whitespace-nowrap px-3 font-mono text-[9px] uppercase tracking-widest text-[#58CCED]/70">
                  Administration
                </div>
              )}
              {collapsed && <div className="my-2.5 border-t border-white/10" />}
              <NavLink href="/admin/users" label="Users" icon={Users} collapsed={collapsed} />
              <NavLink href="/admin/institutions" label="Institutions" icon={Building2} collapsed={collapsed} />
              <NavLink href="/admin/private-companies" label="Private Companies" icon={Briefcase} collapsed={collapsed} />
            </>
          )}
          {profile.role === "super_admin" && (
            <NavLink href="/admin/regions" label="Regions &amp; Admins" icon={MapPin} collapsed={collapsed} />
          )}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-white/10 pt-3">
          <div
            className={`mb-2.5 flex items-center gap-2 rounded-lg border border-dashed border-[#58CCED]/50 bg-white/5 px-2 py-1.5 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#58CCED] font-mono text-[9px] font-semibold text-[#58CCED]">
              {initials}
            </div>
            <div
              className={`overflow-hidden leading-tight transition-opacity duration-200 ${
                collapsed ? "w-0 opacity-0 duration-100" : "w-auto opacity-100 delay-100"
              }`}
            >
              <div className="whitespace-nowrap text-[11px] font-semibold text-white">{profile.full_name}</div>
              <div className="whitespace-nowrap font-mono text-[9px] tracking-wide text-[#58CCED]">
                {profile.role === "super_admin" ? "GLOBAL · ALL REGIONS" : (regionName || "REGION UNASSIGNED").toUpperCase()}
              </div>
            </div>
          </div>
          <form action={signOut}>
            <button
              className={`w-full rounded-md border border-white/10 py-1.5 text-[11px] text-white/80 transition-colors hover:bg-white/5 ${
                collapsed ? "px-0" : "px-3 text-left"
              }`}
            >
              {collapsed ? "⏻" : "Sign out"}
            </button>
          </form>
        </div>
      </div>

      {/* Thin webkit scrollbar for the nav */}
      <style jsx global>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-2 rounded-md py-2 text-[12.5px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white ${
        collapsed ? "justify-center px-0" : "px-2.5"
      }`}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span
        className={`overflow-hidden whitespace-nowrap transition-opacity duration-200 ${
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100 delay-100"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}