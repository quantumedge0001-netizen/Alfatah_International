"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white transition hover:bg-ink2 disabled:opacity-60"
    >
      {pending ? "Creating account…" : "Sign up"}
    </button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useActionState<{ error: string | null }, FormData>(
  signUp,
  { error: null }
);

    return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-ink font-display text-base font-bold text-ink">
            M
          </div>
          <h1 className="font-display text-lg font-semibold text-ink">Membrane Mart</h1>
          <p className="mt-1 text-xs text-muted">Create your account</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-medium text-muted">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink"
              placeholder="Your name"
            />
          </div>
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
              minLength={6}
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
          Already have an account?{" "}
          <a href="/login" className="font-medium text-ink underline underline-offset-2">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}