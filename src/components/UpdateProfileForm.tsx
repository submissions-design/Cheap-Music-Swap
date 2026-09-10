"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions/account.actions";
import { FormAlert } from "@/components/AuthForm";
import type { User } from "@/lib/db/types";

export default function UpdateProfileForm({ user }: { user: User }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, {});

  return (
    <form action={formAction} className="card p-5 grid sm:grid-cols-2 gap-3">
      <div>
        <label className="field-label" htmlFor="firstName">First name</label>
        <input id="firstName" name="firstName" required defaultValue={user.first_name} className="field-input" />
      </div>
      <div>
        <label className="field-label" htmlFor="lastName">Last name</label>
        <input id="lastName" name="lastName" required defaultValue={user.last_name} className="field-input" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label">Email</label>
        <input value={user.email} disabled className="field-input opacity-60" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="phone">Phone</label>
        <input id="phone" name="phone" defaultValue={user.phone ?? ""} className="field-input" />
      </div>
      <div className="sm:col-span-2">
        <FormAlert state={state} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
