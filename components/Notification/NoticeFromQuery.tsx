"use client";

import { useEffect } from "react";
import { useNotification } from "./context";
import type { NotificationInput } from "./types";

export type NoticeMap = Record<string, NotificationInput>;

/**
 * Fires a notification once on mount based on a `?<paramKey>=<key>` value in
 * the current URL, then strips that param from the address bar. Drop this
 * into any page/layout to surface a one-off notice after a redirect, e.g.
 * `redirect("/dashboard?notice=login-success")` on the server.
 */
export default function NoticeFromQuery({
  paramKey = "notice",
  map,
}: {
  paramKey?: string;
  map: NoticeMap;
}) {
  const { notify } = useNotification();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get(paramKey);
    const input = key ? map[key] : undefined;
    if (!input) return;

    notify(input);

    params.delete(paramKey);
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
