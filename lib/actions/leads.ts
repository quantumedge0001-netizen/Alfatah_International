"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type LeadStatus = "new" | "contacted" | "qualified" | "quoted" | "won" | "lost";

// Called directly from a client component (not via <form action>), since
// these are single-field row-level edits (a <select onChange>), not a
// full form submission. Next.js Server Actions support both call styles.
export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<{ error: string | null }> {
  await requireProfile(); // just needs a valid session; RLS enforces who can actually write

  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);

  if (error) {
    return { error: "Could not update status. " + error.message };
  }

  revalidatePath("/leads");
  return { error: null };
}

// Assignment is an admin/management action — checked at the app layer here
// for a clean error message, on top of whatever RLS already enforces.
// NOTE: there's no dedicated "salesperson" role in the current profiles
// schema (just super_admin/admin/user), so any profile can currently be
// assigned a lead. Tighten this once roles are more granular.
export async function assignLead(leadId: string, userId: string | null): Promise<{ error: string | null }> {
  const profile = await requireProfile();

  if (profile.role === "user") {
    return { error: "Only Admins can reassign leads." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ assigned_to: userId }).eq("id", leadId);

  if (error) {
    return { error: "Could not assign lead. " + error.message };
  }

  revalidatePath("/leads");
  return { error: null };
}
