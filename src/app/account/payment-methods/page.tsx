import { requireUser } from "@/lib/auth";
import { listPaymentMethods } from "@/lib/db/repo";
import { deletePaymentMethodAction } from "@/lib/actions/account.actions";
import AddPaymentMethodForm from "@/components/AddPaymentMethodForm";

export default async function PaymentMethodsPage() {
  const user = await requireUser("/account/payment-methods");
  const methods = listPaymentMethods(user.id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Payment Options</h1>

      <div className="space-y-2 mb-8">
        {methods.length === 0 && <p className="text-sm text-ink-muted">No saved payment methods yet.</p>}
        {methods.map((m) => (
          <div key={m.id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{m.label}</p>
              <p className="text-xs text-ink-muted">Expires {m.exp_month}/{m.exp_year}{m.is_default ? " · Default" : ""}</p>
            </div>
            <form action={deletePaymentMethodAction}>
              <input type="hidden" name="methodId" value={m.id} />
              <button type="submit" className="text-xs text-danger hover:underline">
                Remove
              </button>
            </form>
          </div>
        ))}
      </div>

      <h2 className="font-semibold mb-3 text-sm">Add a Payment Method</h2>
      <AddPaymentMethodForm />
      <p className="text-xs text-ink-muted mt-3">
        Card details are stored as a non-sensitive reference only (brand + last 4 digits) — this demo build never
        stores full card numbers. See README.md for wiring up a real payment processor's vault/tokenization.
      </p>
    </div>
  );
}
