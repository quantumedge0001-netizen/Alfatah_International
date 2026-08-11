import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exchanges the `code` from a Supabase email link (password reset, invite, etc.)
// for a session, then redirects to `next` (defaults to the reset-password page).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/reset-password";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
  } else {
    console.error("[auth/callback] no `code` param on incoming request:", request.url);
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
