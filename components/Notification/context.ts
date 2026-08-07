"use client";

import { createContext, useContext } from "react";
import type { NotificationInput } from "./types";

export interface NotificationContextValue {
  notify: (input: NotificationInput) => string;
  dismiss: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used within a <NotificationProvider>");
  }
  return ctx;
}
