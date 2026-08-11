"use client";

import { useFormStatus } from "react-dom";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/actions/auth";
import { useNotification } from "@/components/Notification";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 py-2.5 text-sm font-medium text-white transition hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-60"
    >
      {pending ? "Updating…" : "Update password"}
    </button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState<{ error: string | null; success?: boolean }, FormData>(
    updatePassword,
    { error: null }
  );
  const { notify } = useNotification();
  const router = useRouter();

  useEffect(() => {
    if (!state?.success) return;
    notify({
      type: "success",
      title: "Password updated",
      message: "Taking you to sign in…",
    });
    const timer = setTimeout(() => router.push("/login"), 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

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
              Reset password
            </h1>
            <p className="mt-1 text-xs text-white/50">Choose a new password for your account.</p>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-white/60">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-fuchsia-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-fuchsia-400/20"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-xs font-medium text-white/60">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
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
        </div>
      </div>
    </main>
  );
}
