import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { redirect } from "next/navigation";

// Fetches the signed-in user's profile row (role + region_id).
// Redirects to /login if there is no session.
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[requireProfile] getUser error:", userError.message);
  }

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    // Don't swallow this silently — log it so you can tell
    // "RLS denied" apart from "row genuinely missing".
    console.error("[requireProfile] profile fetch error:", error.message, error.code);
    redirect("/login");
  }

  if (!profile) {
    console.error("[requireProfile] no profile row for user:", user.id);
    redirect("/login");
  }

  return profile as Profile;
}