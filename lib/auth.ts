import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { redirect } from "next/navigation";

// Fetches the signed-in user's profile row (role + region_id).
// Redirects to /login if there is no session.
export async function requireProfile(): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) redirect("/login");

  return profile as Profile;
}

// Use inside a page/action to enforce a minimum role tier.
// Order matters: super_admin > admin > user.
const TIER: Record<Profile["role"], number> = {
  super_admin: 3,
  admin: 2,
  user: 1,
};

export function hasAtLeastRole(profile: Profile, minRole: Profile["role"]) {
  return TIER[profile.role] >= TIER[minRole];
}
