import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/services/audit.service";
import { emitEvent } from "@/lib/services/automation.service";
import type { Json } from "@/lib/types";

// Every source adapter (Meta, Google Sheets, website form, manual entry...)
// must produce this shape. No source-specific field names should leak past
// this boundary into lead.service.ts or anything downstream of it.
export interface CanonicalLeadInput {
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string; // 'meta' | 'google_sheets' | 'website' | 'manual' | ...
  external_id: string;
  requirement: string | null;
  raw_payload: Record<string, unknown>;
}

export interface ProcessLeadResult {
  leadId: string;
  wasNewLead: boolean;
}

// Upserts a canonical lead using (source, external_id) as the dedup key —
// the same key enforced at the database level by the unique constraint in
// 0003_leads_webhooks.sql (Phase 6: never rely on app-level checks alone).
export async function processCanonicalLead(input: CanonicalLeadInput): Promise<ProcessLeadResult> {
  const supabase = createServiceClient();

  // Upsert on the (source, external_id) unique constraint. If Meta redelivers
  // the same leadgen_id, this becomes a no-op update rather than a duplicate row.
  const { data: existingLead } = await supabase
    .from("leads")
    .select("id")
    .eq("source", input.source)
    .eq("external_id", input.external_id)
    .maybeSingle();

  const wasNewLead = !existingLead;

  const { data: lead, error } = await supabase
    .from("leads")
    .upsert(
      {
        name: input.name,
        phone: input.phone,
        email: input.email,
        source: input.source,
        external_id: input.external_id,
        requirement: input.requirement,
        raw_payload: input.raw_payload as Json,
      },
      { onConflict: "source,external_id" }
    )
    .select("id")
    .single();

  if (error || !lead) {
    console.error("[lead.service] upsert failed:", error?.message);
    throw new Error(`Failed to upsert lead: ${error?.message}`);
  }

  await recordAudit({
    actor: "system",
    action: wasNewLead ? "lead.created" : "lead.updated",
    entity_type: "lead",
    entity_id: lead.id,
    metadata: { source: input.source, external_id: input.external_id },
  });

  if (wasNewLead) {
    // Fire-and-continue: automation failures must never roll back the lead
    // write itself (context doc section 8.3 — same principle applied to
    // the event that triggers notifications).
    await emitEvent("NEW_LEAD", { leadId: lead.id });
  }

  return { leadId: lead.id, wasNewLead };
}