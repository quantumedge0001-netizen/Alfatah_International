import { createServiceClient } from "@/lib/supabase/service";

export interface AuditEntry {
  actor: string; // profile id, or 'system' for webhook/automation-driven actions
  action: string; // e.g. 'lead.created', 'webhook.rejected', 'notification.failed'
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}

// Append-only. Never throws — a logging failure must never take down the
// business operation it's trying to record. Logs the failure to console
// instead so it's still visible in Vercel logs.
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("audit_logs").insert({
      actor: entry.actor,
      action: entry.action,
      entity_type: entry.entity_type ?? null,
      entity_id: entry.entity_id ?? null,
      metadata: entry.metadata ?? {},
    });

    if (error) {
      console.error("[audit.service] failed to write audit log:", error.message, entry);
    }
  } catch (err) {
    console.error("[audit.service] unexpected error writing audit log:", err, entry);
  }
}
