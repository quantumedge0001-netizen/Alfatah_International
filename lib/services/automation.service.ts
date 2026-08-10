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
// TODO(business-rule): the assignment algorithm is NOT defined in the AF-DOS
// context doc (open question, section 21.1 / 22). Do not hardcode an
// arbitrary rule. This function currently leaves `assigned_to` as NULL
// (unassigned) so the lead is visible and manually assignable in the CRM.
//
// When the rule is decided, implement it here — e.g.:
//   - round-robin: rotate through active `profiles` with role='user' in Sales
//   - territory-based: match `leads.region_id` (once populated) to `profiles.region_id`
//   - workload-based: assign to whoever has the fewest open leads
// and keep the call site (handleNewLead) unchanged.
async function assignLead(leadId: string): Promise<void> {
  console.log(
    `[automation.service] assignLead: no assignment rule configured yet (lead ${leadId} left unassigned).`
  );
  // Intentionally a no-op for now — leads.assigned_to defaults to NULL.
}
