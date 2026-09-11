import { requireUser } from "@/lib/auth";
import { listListingsBySeller, listCategories, listGenres, listArtists } from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";
import CreateListingForm from "@/components/CreateListingForm";

const STATUS_LABEL: Record<string, string> = {
  active: "Live",
  pending_approval: "Pending Review",
  rejected: "Rejected",
  inactive: "Inactive",
};

export default async function SellPage() {
  const user = await requireUser("/account/sell");
  const listings = listListingsBySeller(user.id);
  const [categories, genres, artists] = [listCategories(true), listGenres(true), listArtists()];

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-1">Sell Your Music</h1>
      <p className="text-ink-muted text-sm mb-6">
        List your own CDs, vinyl, or accessories for sale on Cheap Music Swap. New listings are reviewed by our team
        before they go live.
      </p>

      {listings.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-3 text-sm">Your Listings</h2>
          <div className="space-y-2">
            {listings.map((l) => (
              <div key={l.id} className="card p-3 flex items-center justify-between text-sm">
                <span className="line-clamp-1">{l.title}</span>
                <span className="badge">{STATUS_LABEL[l.status] || l.status}</span>
                <span className="font-semibold">{formatMoney(l.price_cents)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-semibold mb-3 text-sm">New Listing</h2>
      <CreateListingForm categories={categories} genres={genres} artists={artists} />
    </div>
  );
}
