"use client";

import { useCallback, useState } from "react";
import { NotificationContext } from "./context";
import NotificationToast from "./NotificationToast";
import type { NotificationInput, NotificationItem } from "./types";

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((input: NotificationInput) => {
    const id = createId();
    setItems((prev) => [...prev, { id, ...input }]);
    return id;
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-2.5 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {items.map((item) => (
          <NotificationToast key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
