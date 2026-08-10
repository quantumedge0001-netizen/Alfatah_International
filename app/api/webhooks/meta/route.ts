import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyMetaChallenge, verifyMetaSignature } from "@/lib/integrations/meta/verify";
import { fetchMetaLeadDetail } from "@/lib/integrations/meta/client";
import { mapMetaLeadToCanonical } from "@/lib/integrations/meta/leads";
import { processCanonicalLead } from "@/lib/services/lead.service";
import { recordAudit } from "@/lib/services/audit.service";
import type { MetaWebhookEnvelope } from "@/lib/integrations/meta/types";

// GET — Meta's one-time webhook verification handshake, run when you
// register this URL in the Meta App dashboard (Webhooks product).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const result = verifyMetaChallenge(mode, token, challenge);

  if (!result.ok) {
    console.error("[webhooks/meta] GET verification failed.");
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Meta expects the raw challenge string back, not JSON.
  return new NextResponse(result.challenge, { status: 200 });
}

// POST — actual lead event delivery.
//
// Kept thin per Phase 12 (Vercel): verify -> acknowledge fast -> hand off.
// Full Meta lead detail is fetched here synchronously for now (Vercel
// functions allow this within their execution limit); if this later needs
// true background processing, extract everything after signature
// verification into a queued job without changing this route's contract.
export async function POST(request: NextRequest) {
  // Signature verification MUST run against the raw body text, before any
  // JSON parsing — read it as text first.
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    console.error("[webhooks/meta] signature verification failed.");
    await recordAudit({
      actor: "system",
      action: "webhook.rejected",
      entity_type: "webhook_event",
      metadata: { source: "meta", reason: "invalid_signature" },
    });
    // Do not leak why verification failed to the caller.
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let envelope: MetaWebhookEnvelope;
  try {
    envelope = JSON.parse(rawBody);
  } catch {
    console.error("[webhooks/meta] invalid JSON body.");
    return new NextResponse("Bad Request", { status: 400 });
  }

  const supabase = createServiceClient();

  // A single delivery can contain multiple entries/changes (e.g. several
  // leads across different pages/forms in one batch). Process each
  // independently so one bad entry doesn't fail the whole delivery.
  for (const entry of envelope.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") {
        continue; // ignore non-lead webhook fields, e.g. page changes
      }

      const leadgenId = change.value.leadgen_id;

      // Idempotency (Phase 6): unique constraint on (source, external_event_id)
      // in webhook_events makes a duplicate delivery a no-op at the DB level.
      const { data: existingEvent } = await supabase
        .from("webhook_events")
        .select("id, status")
        .eq("source", "meta")
        .eq("external_event_id", leadgenId)
        .maybeSingle();

      if (existingEvent) {
        console.log(`[webhooks/meta] duplicate delivery for leadgen_id=${leadgenId}, skipping.`);
        continue;
      }

      const { data: eventRow, error: insertEventError } = await supabase
        .from("webhook_events")
        .insert({
          source: "meta",
          external_event_id: leadgenId,
          event_type: change.field,
          payload: change.value as unknown as Record<string, unknown>,
          status: "processing",
        })
        .select("id")
        .single();

      if (insertEventError || !eventRow) {
        // Constraint race: two concurrent deliveries both passed the
        // maybeSingle() check above before either inserted. The unique
        // constraint on (source, external_event_id) rejects the second
        // insert — that IS the idempotency guarantee working correctly.
        console.log(
          `[webhooks/meta] concurrent duplicate for leadgen_id=${leadgenId}, skipping.`,
          insertEventError?.message
        );
        continue;
      }

      try {
        const leadDetail = await fetchMetaLeadDetail(leadgenId);
        const canonicalLead = mapMetaLeadToCanonical(leadDetail);
        await processCanonicalLead(canonicalLead);

        await supabase
          .from("webhook_events")
          .update({ status: "processed", processed_at: new Date().toISOString() })
          .eq("id", eventRow.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[webhooks/meta] processing failed for leadgen_id=${leadgenId}:`, message);

        await supabase
          .from("webhook_events")
          .update({ status: "failed", error_message: message })
          .eq("id", eventRow.id);

        await recordAudit({
          actor: "system",
          action: "webhook.processing_failed",
          entity_type: "webhook_event",
          entity_id: eventRow.id,
          metadata: { source: "meta", leadgen_id: leadgenId, error: message },
        });
        // Intentionally do not rethrow — one failed lead in a batch should
        // not cause Meta to retry the entire delivery and reprocess the
        // leads that already succeeded.
      }
    }
  }

  // Meta requires a fast 200 acknowledgement regardless of downstream
  // processing outcome, or it will retry (and eventually disable) the webhook.
  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}
