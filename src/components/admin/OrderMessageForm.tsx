"use client";

import { useActionState } from "react";
import { sendOrderMessageAction } from "@/lib/actions/admin-orders.actions";
import { FormAlert } from "@/components/AuthForm";

export default function OrderMessageForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(sendOrderMessageAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <textarea name="body" required rows={3} className="field-input" placeholder="Message the customer about this order..." />
      <FormAlert state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
        {pending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
