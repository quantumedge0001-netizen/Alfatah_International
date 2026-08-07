export type NotificationVariant = "success" | "error" | "warning" | "info";

export interface NotificationInput {
  type: NotificationVariant;
  title: string;
  message?: string;
  /** Auto-dismiss delay in ms. Defaults to 4500. Pass 0 to disable auto-dismiss. */
  duration?: number;
}

export interface NotificationItem extends NotificationInput {
  id: string;
}
