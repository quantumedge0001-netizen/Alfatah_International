// app/api/webhooks/meta/route.ts
//
// Keep this route THIN (context doc section 15 — "keep receiver minimal;
// background processing" for the Vercel timeout concern). It does:
// verify -> log raw event (idempotency) -> fetch/normalize -> hand off to
// lead.service.ts. All business logic (dedup-by-lead, assignment,
// notification, audit) lives in the existing services.
//
// Two HTTP methods:
//   GET  — Meta's one-time webhook subscription verification challenge.
//   POST — actual lead notifications.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchMetaLead, normalizeMetaLead } from "@/lib/integrations/meta/leads";
import { processCanonicalLead } from "@/lib/services/lead.service";
import { recordAudit } from "@/lib/services/audit.service";
import type { Json } from "@/lib/types";

// --- GET: Meta subscription verification -----------------------------------
// https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token && expectedToken && token === expectedToken) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// --- POST: actual lead events -----------------------------------------------
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifyMetaSignature(req, rawBody)) {
    // Do not leak details about why verification failed.
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let body: MetaWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const supabase = createServiceClient();

  // Meta batches multiple changes per delivery — process each independently
  // so one bad entry doesn't block the rest.
  const leadgenChanges = extractLeadgenChanges(body);

  for (const change of leadgenChanges) {
    // Fire-and-continue per entry; log and move on. We still return 200
    // overall so Meta doesn't endlessly retry the whole batch for one bad
    // entry (that entry is captured in webhook_events with status 'failed'
    // for manual follow-up instead).
    await processLeadgenChange(supabase, change).catch((err) => {
      console.error("processLeadgenChange failed", { change, err });
    });
  }

  // Acknowledge fast — required by Meta within a few seconds.
  return NextResponse.json({ received: true });
}

// --- helpers -----------------------------------------------------------------

interface MetaWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: { leadgen_id: string; form_id?: string; page_id?: string; created_time?: number };
    }>;
  }>;
}

interface LeadgenChange {
  leadgenId: string;
  eventId: string; // used as external_event_id for the webhook_events dedup key
  raw: unknown;
}

function extractLeadgenChanges(body: MetaWebhookBody): LeadgenChange[] {
  const changes: LeadgenChange[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field === "leadgen" && change.value?.leadgen_id) {
        changes.push({
          leadgenId: change.value.leadgen_id,
          // Meta doesn't send a separate delivery id; the leadgen_id itself
          // is unique per lead and doubles as our idempotency key.
          eventId: change.value.leadgen_id,
          raw: change,
        });
      }
    }
  }
  return changes;
}

async function processLeadgenChange(
  supabase: ReturnType<typeof createServiceClient>,
  change: LeadgenChange
) {
  // Raw delivery log — this is the webhook_events idempotency layer
  // (distinct from the leads (source, external_id) uniqueness enforced
  // inside lead.service.ts). Duplicate deliveries of the same leadgen_id
  // are a no-op here.
  const { data: eventRow, error: insertError } = await supabase
    .from("webhook_events")
    .insert({
      source: "meta",
      external_event_id: change.eventId,
      event_type: "leadgen",
      payload: change.raw as Json,
      status: "received",
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      // Already received (and being/been processed) — expected for Meta's
      // at-least-once delivery retries. Nothing further to do.
      return;
    }
    throw insertError;
  }

  const eventId = eventRow.id;

  try {
    const rawLead = await fetchMetaLead(change.leadgenId);
    const canonical = normalizeMetaLead(rawLead);
    await processCanonicalLead(canonical);

    await supabase
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", eventId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await supabase
      .from("webhook_events")
      .update({
        status: "failed",
        error_message: message,
        processed_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    await recordAudit({
      actor: "system",
      action: "webhook.processing_failed",
      entity_type: "webhook_event",
      entity_id: eventId,
      metadata: { source: "meta", leadgen_id: change.leadgenId, error: message },
    });

    throw err;
  }
}

function verifyMetaSignature(req: NextRequest, rawBody: string): boolean {
  const appSecret = process.env.META_APP_SECRET;
  const signatureHeader = req.headers.get("x-hub-signature-256");

  if (!appSecret || !signatureHeader) return false;

  const expected =
    "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const sigBuffer = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}