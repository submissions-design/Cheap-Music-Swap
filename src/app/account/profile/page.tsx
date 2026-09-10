import { requireUser } from "@/lib/auth";
import { listAddressesByUser } from "@/lib/db/repo";
import { deleteAddressAction } from "@/lib/actions/account.actions";
import UpdateProfileForm from "@/components/UpdateProfileForm";
import AddAddressForm from "@/components/AddAddressForm";

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");
  const addresses = listAddressesByUser(user.id);

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-xl font-bold mb-6">Account Information</h1>
        <UpdateProfileForm user={user} />
      </div>

      <div>
        <h2 className="font-semibold mb-3">Saved Addresses</h2>
        <p className="text-xs text-ink-muted mb-3">
          Saved addresses let checkout fill itself in automatically instead of retyping every time.
        </p>
        <div className="space-y-2 mb-5">
          {addresses.length === 0 && <p className="text-sm text-ink-muted">No saved addresses yet.</p>}
          {addresses.map((a) => (
            <div key={a.id} className="card p-4 flex items-start justify-between gap-4">
              <div className="text-sm">
                <p className="font-medium">
                  {a.label}
                  {a.is_default_shipping ? " · Default shipping" : ""}
                  {a.is_default_billing ? " · Default billing" : ""}
                </p>
                <p className="text-ink-muted">
                  {a.full_name}
                  <br />
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city}, {a.state} {a.postal_code}
                </p>
              </div>
              <form action={deleteAddressAction}>
                <input type="hidden" name="addressId" value={a.id} />
                <button type="submit" className="text-xs text-danger hover:underline shrink-0">
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
        <AddAddressForm />
      </div>
    </div>
  );
}
