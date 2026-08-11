"use client";

import { useFormStatus } from "react-dom";
import { useActionState, useEffect } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";
import { useNotification } from "@/components/Notification";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 py-2.5 text-sm font-medium text-white transition hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState<{ error: string | null; success?: boolean }, FormData>(
    requestPasswordReset,
    { error: null }
  );
  const { notify } = useNotification();

  useEffect(() => {
    if (!state?.error) return;
    notify({ type: "error", title: "Couldn't send reset link", message: state.error });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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
              Forgot password
            </h1>
            <p className="mt-1 text-xs text-white/50">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {state?.success ? (
            <p className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              If an account exists for that email, a reset link is on its way. Check your inbox.
            </p>
          ) : (
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

              <SubmitButton />
            </form>
          )}

          <p className="mt-6 text-center text-xs text-white/50">
            Remembered your password?{" "}
            <a href="/login" className="font-medium text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200">
              Back to login
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
