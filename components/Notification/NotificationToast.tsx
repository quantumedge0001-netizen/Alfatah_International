"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { NotificationItem } from "./types";

const DEFAULT_DURATION = 4500;

const VARIANT = {
  success: {
    icon: CheckCircle2,
    accent: "bg-emerald-500",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-600",
    bar: "bg-emerald-500",
  },
  error: {
    icon: XCircle,
    accent: "bg-rose-500",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-600",
    bar: "bg-rose-500",
  },
  warning: {
    icon: AlertTriangle,
    accent: "bg-amber-500",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-600",
    bar: "bg-amber-500",
  },
  info: {
    icon: Info,
    accent: "bg-violet-500",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-600",
    bar: "bg-violet-500",
  },
} as const;

export default function NotificationToast({
  item,
  onDismiss,
}: {
  item: NotificationItem;
  onDismiss: (id: string) => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const remainingRef = useRef(item.duration ?? DEFAULT_DURATION);
  const startedAtRef = useRef(Date.now());
  const { icon: Icon, accent, badgeBg, badgeText, bar } = VARIANT[item.type];

  const close = () => {
    setLeaving(true);
    window.setTimeout(() => onDismiss(item.id), 200);
  };

  const start = () => {
    if (item.duration === 0) return;
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(close, remainingRef.current);
  };

  const pause = () => {
    if (item.duration === 0 || timerRef.current === undefined) return;
    window.clearTimeout(timerRef.current);
    remainingRef.current -= Date.now() - startedAtRef.current;
  };

  useEffect(() => {
    start();
    return () => window.clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="status"
      onMouseEnter={pause}
      onMouseLeave={start}
      className={`notification-toast pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-line/80 bg-card py-3.5 pl-4 pr-9 shadow-[0_16px_40px_-12px_rgba(16,28,38,0.28)] ring-1 ring-black/[0.02] ${
        leaving ? "notification-toast-out" : "notification-toast-in"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-[3px] ${accent}`} />

      <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${badgeBg}`}>
        <Icon className={`h-[17px] w-[17px] ${badgeText}`} strokeWidth={2.25} />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[13.5px] font-semibold leading-snug tracking-tight text-ink">{item.title}</p>
        {item.message && <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.message}</p>}
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2 rounded-md p-1 text-muted/70 transition hover:bg-black/[0.04] hover:text-ink"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {item.duration !== 0 && (
        <div
          className={`notification-progress absolute bottom-0 left-0 h-[2px] opacity-40 ${bar}`}
          style={{ animationDuration: `${item.duration ?? DEFAULT_DURATION}ms` }}
        />
      )}
    </div>
  );
}
