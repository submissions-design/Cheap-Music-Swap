"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth.actions";
import { FormAlert } from "@/components/AuthForm";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {});
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";

  return (
    <>
      <form action={formAction} className="card p-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="field-input" />
        </div>
        <div>
          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required className="field-input" />
        </div>

        <FormAlert state={state} />

        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Logging in..." : "Log In"}
        </button>
      </form>

      <div className="card p-3 mt-4 text-xs text-ink-muted">
        Demo accounts — customer: <code>customer@example.com</code> / <code>customer123</code> · admin:{" "}
        <code>admin@cheapmusicswap.com</code> / <code>admin123</code>
      </div>

      <p className="text-sm text-center mt-4">
        New here?{" "}
        <Link href="/register" className="text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
