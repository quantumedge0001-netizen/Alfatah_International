// lib/services/automation.service.ts
//
// EVENT -> CONDITION -> ACTION -> DB CHANGE -> NOTIFICATION backbone
// (AF-DOS context doc, section 9). This file currently implements only
// the "New Lead -> assign -> notify" row of that table. Extend with one
// function per event type as the other rows come into scope
// (quotation follow-up, low stock, etc.) — keep each event's logic
// isolated so this file doesn't become a god-file.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

type ServiceClient = SupabaseClient<Database>;

/**
 * TODO (context doc section 21.1 — open decision): assignment algorithm
 * is not finalized. This is a placeholder round-robin over active,
 * non-suspended sales users. Replace with territory/workload-based logic
 * once that decision is made — this function is the only place that
 * needs to change.
 */
export async function assignSalesperson(supabase: ServiceClient, leadId: string) {
  const { data: salesUsers, error: usersError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "user")
    .eq("status", "active")
    .order("id"); // stable-ish ordering placeholder; swap for real round-robin state

  if (usersError) throw usersError;
  if (!salesUsers || salesUsers.length === 0) {
    // No one to assign — leave unassigned, notify management instead.
    await notifyManagementUnassignedLead(supabase, leadId);
    return;
  }

  // Naive round robin: count existing assignments and pick least-loaded.
  const { data: counts, error: countsError } = await supabase
    .from("leads")
    .select("assigned_to")
    .not("assigned_to", "is", null);

  if (countsError) throw countsError;

  const loadByUser = new Map<string, number>(salesUsers.map((u) => [u.id, 0]));
  for (const row of counts ?? []) {
    if (row.assigned_to && loadByUser.has(row.assigned_to)) {
      loadByUser.set(row.assigned_to, (loadByUser.get(row.assigned_to) ?? 0) + 1);
    }
  }

  const [chosenUserId] = [...loadByUser.entries()].sort((a, b) => a[1] - b[1])[0];

  const { error: updateError } = await supabase
    .from("leads")
    .update({ assigned_to: chosenUserId })
    .eq("id", leadId);

  if (updateError) throw updateError;

  await supabase.from("audit_logs").insert({
    actor: "system",
    action: "lead.assigned",
    entity_type: "lead",
    entity_id: leadId,
    metadata: { assigned_to: chosenUserId },
  });

  await notifyLeadAssigned(supabase, leadId, chosenUserId);
}

async function notifyLeadAssigned(supabase: ServiceClient, leadId: string, userId: string) {
  await supabase.from("notifications").insert({
    recipient: userId,
    type: "NEW_LEAD",
    channel: "in_app",
    title: "New lead assigned to you",
    message: `A new lead has come in and been assigned to you.`,
    status: "pending",
    metadata: { lead_id: leadId },
  });
  // TODO: fan out to email/telegram/whatsapp here once channel priority
  // is decided (context doc section 21.4). Keep each channel's delivery
  // independently retryable — a failed external channel must not roll
  // back this in-app notification or the lead itself.
}

async function notifyManagementUnassignedLead(supabase: ServiceClient, leadId: string) {
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["admin", "super_admin"]);

  if (!admins || admins.length === 0) return;

  await supabase.from("notifications").insert(
    admins.map((a) => ({
      recipient: a.id,
      type: "UNASSIGNED_LEAD",
      channel: "in_app" as const,
      title: "Lead could not be auto-assigned",
      message: "No active salesperson available for a new lead.",
      status: "pending" as const,
      metadata: { lead_id: leadId },
    }))
  );
}