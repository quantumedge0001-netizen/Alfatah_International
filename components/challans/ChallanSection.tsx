"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { createChallan, deleteChallan } from "@/lib/challans/actions";
import type { Challan } from "@/lib/challans/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ChallanSection({
  invoiceId,
  challans,
}: {
  invoiceId: string;
  challans: Challan[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await createChallan(invoiceId);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Ye challan delete karna hai?")) return;
    startTransition(async () => {
      await deleteChallan(id, invoiceId);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <div className="mb-1 font-display text-[14px] font-semibold text-[#072F5F]">Delivery Challan</div>
      <div className="mb-3 text-[12px] text-muted">Goods delivery confirmation for this invoice</div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending}
        className="w-full rounded-lg bg-[#072F5F] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#0a3d7a] disabled:opacity-60"
      >
        {pending ? "Working…" : "+ Generate Delivery Challan"}
      </button>

      {error && <p className="mt-3 rounded-md bg-[#f3e0dd] px-3 py-2 text-xs text-stamp">{error}</p>}

      {challans.length > 0 && (
        <div className="mt-4 space-y-3">
          {challans.map((c) => (
            <div key={c.id} className="rounded-lg bg-[#072F5F]/[0.03] p-3">
              <div className="font-mono text-[12.5px] font-medium text-ink">{c.challan_no}</div>
              <div className="mb-2.5 text-[11.5px] text-muted">{c.challan_date}</div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/challans/${c.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-md border border-line px-3 py-1.5 text-center text-[12px] text-[#072F5F] hover:bg-[#072F5F]/[0.05]"
                >
                  Download PDF
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={pending}
                  className="rounded-md border border-line px-2.5 py-1.5 text-[12px] text-stamp hover:bg-[#f3e0dd] disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
