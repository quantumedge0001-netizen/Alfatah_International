import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Service-role client — bypasses Row Level Security entirely.
//
// USE ONLY from trusted server-side code that never runs based on an
// end-user's session: webhook receivers, cron/background jobs, internal
// automation. NEVER import this from a Server Action that acts on behalf
// of a logged-in user, and NEVER from any client component.
//
// Unlike lib/supabase/server.ts, this does not touch cookies — webhook
// requests have no user session at all.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    // Fail loudly at call time rather than silently falling back to the
    // anon key — a webhook route accidentally running as anon would
    // violate RLS and either fail every insert or fail silently.
    throw new Error(
      "[service client] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
