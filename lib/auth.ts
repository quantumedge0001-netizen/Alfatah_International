"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types";

export async function signIn(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[signIn] auth error:", error.message);
    return { error: error.message };
  }

  // IMPORTANT: redirect() must stay OUTSIDE any try/catch.
  // It throws a special NEXT_REDIRECT internally — if a catch block
  // swallows that throw, the redirect silently never happens.
  redirect("/dashboard");
}

// Fetches the signed-in user's profile row (role + region_id).
// Redirects to /login if there is no session.
// Wrapped in React's cache() so multiple calls within the same request
// (e.g. from a layout AND a page) only hit the DB/auth server once.
export const requireProfile = cache(async (): Promise<Profile> => {
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

  console.log("[requireProfile] looking up profile for user.id:", user.id);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("[requireProfile] profile fetch error:", error.message, error.code);
    redirect("/login");
  }

  if (!profile) {
    console.error("[requireProfile] no profile row for user:", user.id);
    redirect("/login");
  }

  return profile as Profile;
});