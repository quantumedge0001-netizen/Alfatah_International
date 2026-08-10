"use client";

import { useTransition, useState } from "react";
import { updateLeadStatus, assignLead } from "@/lib/actions/leads";

const STATUSES = ["new", "contacted", "qualified", "quoted", "won", "lost"] as const;

export default function LeadRowActions({
  leadId,
  status,
  assignedTo,
  assignableUsers,
  canAssign,
}: {
  leadId: string;
  status: string;
  assignedTo: string | null;
  assignableUsers: { id: string; full_name: string }[];
  canAssign: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as (typeof STATUSES)[number];
    setError(null);
    startTransition(async () => {
      const result = await updateLeadStatus(leadId, newStatus);
      if (result.error) setError(result.error);
    });
  }

  function handleAssignChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newAssignee = e.target.value || null;
    setError(null);
    startTransition(async () => {
      const result = await assignLead(leadId, newAssignee);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={status}
        onChange={handleStatusChange}
        disabled={isPending}
        className={`select-mini status-pill ${status}`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {canAssign ? (
        <select
          defaultValue={assignedTo ?? ""}
          onChange={handleAssignChange}
          disabled={isPending}
          className="select-mini"
        >
          <option value="">Unassigned</option>
          {assignableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </select>
      ) : (
        <span className="text-xs text-muted">{assignableUsers.find((u) => u.id === assignedTo)?.full_name ?? "Unassigned"}</span>
      )}

      {error && <span className="text-[10px] text-stamp">{error}</span>}

      <style>{`.select-mini { border: 1px solid var(--line); border-radius: 6px; padding: 3px 6px; font-size: 11.5px; background: white; }`}</style>
    </div>
  );
}
