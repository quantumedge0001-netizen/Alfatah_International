import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

// Route guards. Actual data isolation is still enforced by Supabase RLS —
// this layer only protects the UI/navigation, per section 7 of the design doc.
const SUPER_ADMIN_ONLY = ["/admin/regions"];
const ADMIN_AND_UP = ["/admin/users"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isPublic = path === "/login" || path === "/signup" || path.startsWith("/_next") || path.startsWith("/manifest");

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (path.startsWith("/admin"))) {
    // Look up role for route-guard purposes only.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => request.cookies.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    if (SUPER_ADMIN_ONLY.some((p) => path.startsWith(p)) && role !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (ADMIN_AND_UP.some((p) => path.startsWith(p)) && role === "user") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json).*)"],
};
