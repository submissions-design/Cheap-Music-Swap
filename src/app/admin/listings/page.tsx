import { listPendingListings } from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";
import { approveListingAction, rejectListingAction } from "@/lib/actions/listings.actions";

export default async function AdminListingsPage() {
  const listings = listPendingListings();

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Seller Listings Awaiting Review</h1>
      {listings.length === 0 ? (
        <p className="text-sm text-ink-muted">Nothing to review right now.</p>
      ) : (
        <div className="space-y-4">
          {listings.map((l) => (
            <div key={l.id} className="card p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="font-semibold text-sm">{l.title} {l.artist ? `— ${l.artist}` : ""}</p>
                  <p className="text-xs text-ink-muted">{l.format} · {l.condition} · {formatMoney(l.price_cents)} · Qty {l.quantity}</p>
                </div>
              </div>
              <p className="text-sm mb-3">{l.description}</p>
              <div className="flex flex-wrap items-center gap-2">
                <form action={approveListingAction}>
                  <input type="hidden" name="productId" value={l.id} />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Approve
                  </button>
                </form>
                <form action={rejectListingAction} className="flex items-center gap-2">
                  <input type="hidden" name="productId" value={l.id} />
                  <input name="note" placeholder="Reason (optional)" className="field-input btn-sm py-1 text-xs w-48" />
                  <button type="submit" className="btn btn-secondary btn-sm">
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
