"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white transition hover:bg-ink2 disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, { error: null });

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-ink font-display text-base font-bold text-ink">
            M
          </div>
          <h1 className="font-display text-lg font-semibold text-ink">Membrane Mart</h1>
          <p className="mt-1 text-xs text-muted">Import &amp; Government Sales Platform</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink"
              placeholder="you@membranemart.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-muted">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <p className="rounded-md bg-[#f3e0dd] px-3 py-2 text-xs text-stamp">{state.error}</p>
          )}

          <SubmitButton />
        </form>

        <p className="mt-6 text-center text-[11px] text-muted">
          Accounts are created by your Admin or Super Admin. Contact them for access.
        </p>
      </div>
    </main>
  );
}
