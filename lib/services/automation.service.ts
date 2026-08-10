import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/services/audit.service";
import { notify } from "@/lib/services/notification.service";

// Source-agnostic event bus. A NEW_LEAD event can be emitted by the Meta
// webhook today, and by Google Sheets sync / website forms / manual CRM
// entry later — all of them call emitEvent("NEW_LEAD", ...) and never touch
// Meta-specific code (context doc section 9 / prompt Phase 7).
export type AutomationEventType = "NEW_LEAD";

interface EventPayloads {
  NEW_LEAD: { leadId: string };
}

type Handler<E extends AutomationEventType> = (payload: EventPayloads[E]) => Promise<void>;

const handlers: { [E in AutomationEventType]: Handler<E>[] } = {
  NEW_LEAD: [handleNewLead],
};

export async function emitEvent<E extends AutomationEventType>(
  event: E,
  payload: EventPayloads[E]
): Promise<void> {
  for (const handler of handlers[event]) {
    try {
      await handler(payload);
    } catch (err) {
      // One handler failing must not block others, and must never roll back
      // the underlying database write that triggered the event.
      console.error(`[automation.service] handler failed for event=${event}:`, err);
      await recordAudit({
        actor: "system",
        action: "automation.handler_failed",
        entity_type: "lead",
        entity_id: "leadId" in payload ? (payload as { leadId: string }).leadId : undefined,
        metadata: { event, error: err instanceof Error ? err.message : String(err) },
      });
    }
  }
}

// --- NEW_LEAD handler --------------------------------------------------------
//
// EVENT (NEW_LEAD) -> CONDITION -> ACTION -> DB CHANGE -> NOTIFICATION -> AUDIT
// per context doc section 9.
async function handleNewLead(payload: EventPayloads["NEW_LEAD"]): Promise<void> {
  await assignLead(payload.leadId);
  await notify({
    type: "NEW_LEAD",
    title: "New lead received",
    message: `A new lead (id: ${payload.leadId}) needs follow-up.`,
    channel: "in_app",
    metadata: { leadId: payload.leadId },
  });
  await recordAudit({
    actor: "system",
    action: "automation.new_lead_processed",
    entity_type: "lead",
    entity_id: payload.leadId,
  });
}

// --- Lead assignment ----------------------------------------------------------
//
// Assignment rule (context doc section 21.1): naive least-load round robin
// over active, non-suspended users with role='user' (Sales). This is a
// placeholder — swap for territory-based or workload-weighted logic here
// once that business decision is finalized. Call site (handleNewLead)
// never needs to change.
async function assignLead(leadId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: salesUsers, error: usersError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "user")
    .eq("status", "active");

  if (usersError) {
    console.error("[automation.service] failed to load sales users:", usersError.message);
    return;
  }

  if (!salesUsers || salesUsers.length === 0) {
    console.log(
      `[automation.service] assignLead: no active sales users available (lead ${leadId} left unassigned).`
    );
    await notifyManagementUnassigned(leadId);
    return;
  }

  const { data: assignedCounts, error: countsError } = await supabase
    .from("leads")
    .select("assigned_to")
    .not("assigned_to", "is", null);

  if (countsError) {
    console.error("[automation.service] failed to load assignment counts:", countsError.message);
    return;
  }

  const loadByUser = new Map<string, number>(salesUsers.map((u) => [u.id, 0]));
  for (const row of assignedCounts ?? []) {
    if (row.assigned_to && loadByUser.has(row.assigned_to)) {
      loadByUser.set(row.assigned_to, (loadByUser.get(row.assigned_to) ?? 0) + 1);
    }
  }

  const [chosenUserId] = [...loadByUser.entries()].sort((a, b) => a[1] - b[1])[0];

  const { error: updateError } = await supabase
    .from("leads")
    .update({ assigned_to: chosenUserId })
    .eq("id", leadId);

  if (updateError) {
    console.error("[automation.service] failed to assign lead:", updateError.message);
    return;
  }

  await recordAudit({
    actor: "system",
    action: "lead.assigned",
    entity_type: "lead",
    entity_id: leadId,
    metadata: { assigned_to: chosenUserId },
  });

  await notify({
    type: "NEW_LEAD",
    title: "New lead assigned to you",
    message: "A new lead has come in and been assigned to you.",
    channel: "in_app",
    recipient: chosenUserId,
    metadata: { leadId },
  });
}

async function notifyManagementUnassigned(leadId: string): Promise<void> {
  await notify({
    type: "UNASSIGNED_LEAD",
    title: "Lead could not be auto-assigned",
    message: "No active salesperson available for a new lead.",
    channel: "in_app",
    // recipient omitted -> notify() falls back to all admins/super_admins
    metadata: { leadId },
  });
}