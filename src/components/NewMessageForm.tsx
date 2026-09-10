"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/actions/auth.actions";
import { FormAlert } from "@/components/AuthForm";

export default function NewMessageForm({
  action,
  isLoggedIn,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  isLoggedIn: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="card p-5 space-y-4">
      {!isLoggedIn && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="guestName">Your name</label>
            <input id="guestName" name="guestName" required className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="guestEmail">Your email</label>
            <input id="guestEmail" name="guestEmail" type="email" required className="field-input" />
          </div>
        </div>
      )}
      <div>
        <label className="field-label" htmlFor="subject">Subject</label>
        <input id="subject" name="subject" required className="field-input" />
      </div>
      <div>
        <label className="field-label" htmlFor="body">Message</label>
        <textarea id="body" name="body" required rows={5} className="field-input" />
      </div>
      <FormAlert state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
