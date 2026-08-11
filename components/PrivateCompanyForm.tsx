"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createPrivateCompany } from "@/lib/actions/private-companies";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[#072F5F] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0a3d7a] disabled:opacity-60"
    >
      {pending ? "Adding…" : "+ Add Company"}
    </button>
  );
}

export default function PrivateCompanyForm() {
  const [state, formAction] = useActionState<{ error: string | null }, FormData>(
    createPrivateCompany,
    { error: null }
  );

  return (
    <form action={formAction} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-card p-4">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Company name</span>
        <input name="name" required className="input" placeholder="e.g. Zainab Textiles" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">City</span>
        <input name="city" className="input" placeholder="e.g. Karachi" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Contact info</span>
        <input name="contact_info" className="input" placeholder="phone / email" />
      </label>
      <SubmitButton />
      {state?.error && <p className="w-full text-xs text-stamp">{state.error}</p>}
      <style>{`.input { border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: white; min-width: 180px; }`}</style>
    </form>
  );
}
