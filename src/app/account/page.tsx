import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listOrdersByUser, listListingsBySeller } from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";

export default async function AccountDashboard() {
  const user = await requireUser("/account");
  const orders = listOrdersByUser(user.id);
  const listings = listListingsBySeller(user.id);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Welcome back, {user.first_name}</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <div className="text-2xl font-bold text-brand">{orders.length}</div>
          <div className="text-xs text-ink-muted">Orders placed</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-brand">{listings.length}</div>
          <div className="text-xs text-ink-muted">Items you've listed</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-brand">{user.is_verified ? "Verified" : "Unverified"}</div>
          <div className="text-xs text-ink-muted">Email status</div>
        </div>
      </div>

      <h2 className="font-semibold mb-3">Recent Orders</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No orders yet. <Link href="/shop" className="text-brand hover:underline">Start shopping →</Link>
        </p>
      ) : (
        <div className="space-y-2">
          {orders.slice(0, 5).map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="card p-3 flex items-center justify-between text-sm hover:shadow-md">
              <span className="font-medium">{o.order_number}</span>
              <span className="badge capitalize">{o.status}</span>
              <span>{formatMoney(o.total_cents)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
