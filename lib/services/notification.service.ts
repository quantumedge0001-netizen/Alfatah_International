import { createServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/types";

export type NotificationChannel = "in_app" | "email" | "telegram" | "whatsapp" | "push";

export interface NotifyInput {
  type: string; // e.g. 'NEW_LEAD'
  title: string;
  message?: string;
  channel: NotificationChannel;
  recipient?: string; // profile id; omit to notify all admins/super_admins (see resolveRecipients)
  metadata?: Record<string, unknown>;
}

// The lead/automation services only ever call notify(). This function
// decides HOW delivery happens — callers never talk to Telegram/WhatsApp/etc.
// directly (Phase 9 requirement: do not tightly couple lead service to any channel).
export async function notify(input: NotifyInput): Promise<void> {
  const supabase = createServiceClient();
  const recipients = input.recipient ? [input.recipient] : await resolveDefaultRecipients();

  for (const recipient of recipients) {
    const { data: row, error } = await supabase
      .from("notifications")
      .insert({
        recipient,
        type: input.type,
        channel: input.channel,
        title: input.title,
        message: input.message ?? null,
        metadata: (input.metadata ?? {}) as Json,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !row) {
      console.error("[notification.service] failed to write notification row:", error?.message);
      continue;
    }

    // Dispatch to the actual channel. A failure here must never affect the
    // underlying lead/business record (context doc section 8.3).
    await dispatch(input.channel, row.id, input);
  }
}

async function resolveDefaultRecipients(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["super_admin", "admin"]);

  if (error || !data) {
    console.error("[notification.service] could not resolve default recipients:", error?.message);
    return [];
  }

  return data.map((p) => p.id);
}

async function dispatch(
  channel: NotificationChannel,
  notificationId: string,
  input: NotifyInput
): Promise<void> {
  switch (channel) {
    case "in_app":
      // The `notifications` row itself IS the in-app notification — Supabase
      // Realtime on that table is what the CRM UI subscribes to. Nothing
      // further to dispatch.
      await markSent(notificationId);
      return;

    case "email":
    case "telegram":
    case "whatsapp":
    case "push":
      // NOT IMPLEMENTED: no credentials/configuration exist yet in this
      // project for these channels (no RESEND_API_KEY / TELEGRAM_BOT_TOKEN /
      // WhatsApp Business API config in .env.example). Per Rule #17, this
      // deliberately does not send a fake/simulated request. Wire this up
      // once real credentials are available — the notifications table
      // already has everything needed (recipient, title, message, metadata).
      console.log(
        `[notification.service] channel "${channel}" not yet configured — notification row saved as pending only.`
      );
      return;
  }
}

async function markSent(notificationId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("notifications")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", notificationId);
}