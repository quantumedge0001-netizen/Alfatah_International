import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  let regionName: string | undefined;
  if (profile.region_id) {
    const supabase = await createClient();
    const { data } = await supabase.from("regions").select("name").eq("id", profile.region_id).single();
    regionName = data?.name;
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar profile={profile} regionName={regionName} />
      <main className="max-w-[1280px] flex-1 px-8 py-7">{children}</main>
    </div>
  );
}
