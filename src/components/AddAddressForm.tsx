"use client";

import { useActionState } from "react";
import { addAddressAction } from "@/lib/actions/account.actions";
import { FormAlert } from "@/components/AuthForm";

export default function AddAddressForm() {
  const [state, formAction, pending] = useActionState(addAddressAction, {});

  return (
    <form action={formAction} className="card p-5 grid sm:grid-cols-2 gap-3">
      <div>
        <label className="field-label" htmlFor="label">Label</label>
        <input id="label" name="label" defaultValue="Home" className="field-input" />
      </div>
      <div>
        <label className="field-label" htmlFor="fullName">Full name</label>
        <input id="fullName" name="fullName" required className="field-input" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="line1">Address</label>
        <input id="line1" name="line1" required className="field-input" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="line2">Apt / Suite (optional)</label>
        <input id="line2" name="line2" className="field-input" />
      </div>
      <div>
        <label className="field-label" htmlFor="city">City</label>
        <input id="city" name="city" required className="field-input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="state">State</label>
          <input id="state" name="state" required maxLength={2} className="field-input" placeholder="NY" />
        </div>
        <div>
          <label className="field-label" htmlFor="postalCode">ZIP</label>
          <input id="postalCode" name="postalCode" required className="field-input" />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="phone">Phone (optional)</label>
        <input id="phone" name="phone" className="field-input" />
      </div>
      <div className="flex items-center gap-4 pt-6">
        <label className="flex items-center gap-1.5 text-sm">
          <input name="isDefaultShipping" type="checkbox" /> Default shipping
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input name="isDefaultBilling" type="checkbox" /> Default billing
        </label>
      </div>
      <div className="sm:col-span-2">
        <FormAlert state={state} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving..." : "Save Address"}
        </button>
      </div>
    </form>
  );
}
