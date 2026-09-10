"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth.actions";
import { FormAlert } from "@/components/AuthForm";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, {});

  return (
    <div className="container-page py-14 max-w-md">
      <h1 className="text-2xl font-bold mb-1">Create an Account</h1>
      <p className="text-ink-muted text-sm mb-6">
        Register to check out faster, track orders, and list your own music for sale.
      </p>

      <form action={formAction} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" required className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" required className="field-input" />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="field-input" />
        </div>
        <div>
          <label className="field-label" htmlFor="phone">Phone (optional)</label>
          <input id="phone" name="phone" type="tel" className="field-input" />
        </div>
        <div>
          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={8} className="field-input" />
          <p className="text-xs text-ink-muted mt-1">At least 8 characters.</p>
        </div>

        <FormAlert state={state} />

        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-xs text-ink-muted text-center">
          By registering you agree to our <Link href="/terms" className="hover:underline">Terms of Use</Link> and{" "}
          <Link href="/privacy" className="hover:underline">Privacy Notice</Link>.
        </p>
      </form>

      <p className="text-sm text-center mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
