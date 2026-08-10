// lib/services/lead-ingestion.service.ts
//
// Shared pipeline every source adapter funnels into:
//   log raw event -> dedupe -> insert canonical lead -> audit -> automation
//
// This file has no knowledge of Meta/Google/etc. It only knows the
// canonical Lead shape (see lib/integrations/meta/leads.ts for that type).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/types";
import type { CanonicalLead } from "@/lib/integrations/meta/leads";
import { assignSalesperson } from "@/lib/services/automation.service";

type ServiceClient = SupabaseClient<Database>;

export interface WebhookEventInput {
  source: string;
  external_event_id: string;
  event_type?: string;
  payload: Record<string, unknown>;
}

/**
 * Logs a raw webhook delivery. Relies on the DB-level unique constraint
 * (source, external_event_id) for idempotency — if this event was already
 * received, the insert is a no-op and we return { duplicate: true } instead
 * of throwing, so callers can acknowledge (200) without reprocessing.
 */
export async function logWebhookEvent(
  supabase: ServiceClient,
  event: WebhookEventInput
): Promise<{ id: string | null; duplicate: boolean }> {
  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      source: event.source,
      external_event_id: event.external_event_id,
      event_type: event.event_type,
      payload: event.payload as Json,
      status: "received",
    })
    .select("id")
    .single();

  if (error) {
    // Postgres unique_violation
    if (error.code === "23505") {
      return { id: null, duplicate: true };
    }
    throw error;
  }

  return { id: data.id, duplicate: false };
}

export async function markWebhookEventStatus(
  supabase: ServiceClient,
  eventId: string,
  status: Database["public"]["Enums"]["webhook_event_status"],
  errorMessage?: string
) {
  await supabase
    .from("webhook_events")
    .update({
      status,
      error_message: errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", eventId);
}

/**
 * Inserts (or, if already present, leaves untouched) the canonical lead
 * row, then hands off to automation for assignment + notification.
 * Dedup key is (source, external_id) — matches the DB unique constraint.
 */
export async function upsertCanonicalLead(
  supabase: ServiceClient,
  lead: CanonicalLead
): Promise<{ leadId: string; wasNew: boolean }> {
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("source", lead.source)
    .eq("external_id", lead.external_id)
    .maybeSingle();

  if (existing) {
    return { leadId: existing.id, wasNew: false };
  }

  const { data: inserted, error } = await supabase
    .from("leads")
    .insert({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      external_id: lead.external_id,
      raw_payload: lead.raw_payload as Json,
      requirement: lead.requirement,
      status: "new",
    })
    .select("id")
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor: "system",
    action: "lead.created",
    entity_type: "lead",
    entity_id: inserted.id,
    metadata: { source: lead.source, external_id: lead.external_id },
  });

  // Fire-and-continue: assignment/notification failures should not fail
  // the webhook response. Errors are swallowed here on purpose; the
  // automation service is responsible for its own retry/logging.
  assignSalesperson(supabase, inserted.id).catch((err) => {
    console.error("assignSalesperson failed", { leadId: inserted.id, err });
  });

  return { leadId: inserted.id, wasNew: true };
}