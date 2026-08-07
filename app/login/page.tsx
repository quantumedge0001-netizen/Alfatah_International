"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 py-2.5 text-sm font-medium text-white transition hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Login"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<{ error: string | null }, FormData>(
    signIn,
    { error: null }
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0b14] px-4 py-10 sm:px-6">
      {/* ambient glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, rgba(99,60,220,0.35) 0%, rgba(11,11,20,0) 70%), radial-gradient(45% 40% at 20% 70%, rgba(70,50,200,0.25) 0%, rgba(11,11,20,0) 70%)",
        }}
      />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#12121e]/90 shadow-[0_0_60px_-15px_rgba(139,92,246,0.35)] backdrop-blur-sm">
        {/* gradient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400" />

        <div className="p-6 sm:p-8">
          <div className="mb-7 text-center sm:mb-8">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-white/30 font-display text-base font-bold text-white">
              M
            </div>
            <h1 className="font-display text-lg font-semibold text-white sm:text-xl">
              Membrane Mart
            </h1>
            <p className="mt-1 text-xs text-white/50">Import &amp; Government Sales Platform</p>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-white/60">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-fuchsia-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-fuchsia-400/20"
                placeholder="you@membranemart.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-white/60">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-fuchsia-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-fuchsia-400/20"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <p className="rounded-md border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {state.error}
              </p>
            )}

            <SubmitButton />
          </form>

          <p className="mt-6 text-center text-[11px] text-white/40">
            Accounts are created by your Admin or Super Admin. Contact them for access.
          </p>

          <p className="mt-3 text-center text-xs text-white/50">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="font-medium text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
