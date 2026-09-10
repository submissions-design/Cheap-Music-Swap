"use client";

import { useActionState } from "react";
import { cancelOrderAction } from "@/lib/actions/account.actions";

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(cancelOrderAction, {});

  return (
    <form action={formAction} className="mt-2">
      <input type="hidden" name="orderId" value={orderId} />
      {state?.error && <p className="alert-error mb-2 text-xs">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-danger btn-sm">
        {pending ? "Cancelling..." : "Cancel Order"}
      </button>
    </form>
  );
}
