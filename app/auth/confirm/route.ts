import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Verifies the `token_hash` from a Supabase email link (password reset, invite, etc.)
// directly against Supabase, then redirects to `next`. Unlike /auth/callback's PKCE
// code exchange, this doesn't need a code_verifier cookie from the requesting browser,
// so the link works even when opened on a different device (e.g. email on mobile).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/reset-password";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/confirm] verifyOtp error:", error.message);
  } else {
    console.error("[auth/confirm] missing token_hash or type on incoming request:", request.url);
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
