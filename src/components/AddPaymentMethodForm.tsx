"use client";

import { useActionState } from "react";
import { addPaymentMethodAction } from "@/lib/actions/account.actions";
import { FormAlert } from "@/components/AuthForm";

export default function AddPaymentMethodForm() {
  const [state, formAction, pending] = useActionState(addPaymentMethodAction, {});

  return (
    <form action={formAction} className="card p-5 grid sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="cardNumber">Card number</label>
        <input id="cardNumber" name="cardNumber" required inputMode="numeric" placeholder="4111 1111 1111 1111" className="field-input" />
      </div>
      <div>
        <label className="field-label" htmlFor="expMonth">Exp. month</label>
        <input id="expMonth" name="expMonth" type="number" min={1} max={12} required className="field-input" placeholder="12" />
      </div>
      <div>
        <label className="field-label" htmlFor="expYear">Exp. year</label>
        <input id="expYear" name="expYear" type="number" min={new Date().getFullYear()} required className="field-input" placeholder="2029" />
      </div>
      <div>
        <label className="field-label" htmlFor="cvc">CVC</label>
        <input id="cvc" name="cvc" required inputMode="numeric" maxLength={4} className="field-input" placeholder="123" />
      </div>
      <div className="flex items-center gap-2 pt-6">
        <input id="isDefault" name="isDefault" type="checkbox" />
        <label htmlFor="isDefault" className="text-sm">Make default</label>
      </div>
      <div className="sm:col-span-2">
        <FormAlert state={state} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving..." : "Save Payment Method"}
        </button>
      </div>
    </form>
  );
}
