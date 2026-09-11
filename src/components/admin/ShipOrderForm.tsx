"use client";

import { useActionState } from "react";
import { shipOrderAction } from "@/lib/actions/admin-orders.actions";
import { FormAlert } from "@/components/AuthForm";
import type { Carrier } from "@/lib/db/types";

export default function ShipOrderForm({
  orderId,
  carriers,
  currentCarrierId,
  currentTrackingNumber,
}: {
  orderId: string;
  carriers: Carrier[];
  currentCarrierId: string | null;
  currentTrackingNumber: string | null;
}) {
  const [state, formAction, pending] = useActionState(shipOrderAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="carrierId">Carrier</label>
          <select id="carrierId" name="carrierId" required className="field-input" defaultValue={currentCarrierId ?? ""}>
            <option value="" disabled>Choose...</option>
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="trackingNumber">Tracking Number</label>
          <input
            id="trackingNumber"
            name="trackingNumber"
            required
            defaultValue={currentTrackingNumber ?? ""}
            className="field-input"
          />
        </div>
      </div>
      <FormAlert state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
        {pending ? "Sending..." : "Mark Shipped & Email Tracking"}
      </button>
    </form>
  );
}
