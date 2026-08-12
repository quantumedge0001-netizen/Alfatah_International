"use client";

import { useTransition } from "react";
import { updateInvoiceStatus, deleteInvoice } from "@/lib/invoices/actions";
import type { InvoiceStatus } from "@/lib/invoices/types";

export default function InvoiceActions({ id, status }: { id: string; status: InvoiceStatus }) {
  const [pending, startTransition] = useTransition();

  function setStatus(next: InvoiceStatus) {
    startTransition(async () => {
      await updateInvoiceStatus(id, next);
    });
  }

  function onDelete() {
    if (!confirm("Ye invoice delete karni hai? Ye wapas nahi ho sakta.")) return;
    startTransition(async () => {
      await deleteInvoice(id);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "sent" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus("sent")}
          className="rounded-md border border-line px-3 py-1.5 text-[12.5px] text-[#072F5F] hover:bg-[#072F5F]/[0.05] disabled:opacity-60"
        >
          Mark as Sent
        </button>
      )}
      {status !== "paid" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus("paid")}
          className="rounded-md border border-line px-3 py-1.5 text-[12.5px] text-[#072F5F] hover:bg-[#072F5F]/[0.05] disabled:opacity-60"
        >
          Mark as Paid
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={onDelete}
        className="rounded-md border border-line px-3 py-1.5 text-[12.5px] text-stamp hover:bg-[#f3e0dd] disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}
