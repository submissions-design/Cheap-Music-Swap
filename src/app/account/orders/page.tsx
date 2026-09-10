import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listOrdersByUser } from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";

const STATUS_STYLES: Record<string, string> = {
  processing: "bg-surface-muted text-ink-muted",
  paid: "bg-surface-muted text-ink-muted",
  shipped: "bg-surface-muted text-success",
  cancelled: "bg-surface-muted text-danger",
  refunded: "bg-surface-muted text-danger",
};

export default async function OrderHistoryPage() {
  const user = await requireUser("/account/orders");
  const orders = listOrdersByUser(user.id);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Order History</h1>
      {orders.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No orders yet. <Link href="/shop" className="text-brand hover:underline">Start shopping →</Link>
        </p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="card p-4 flex flex-wrap items-center justify-between gap-2 hover:shadow-md">
              <div>
                <p className="font-semibold text-sm">{o.order_number}</p>
                <p className="text-xs text-ink-muted">{new Date(o.placed_at).toLocaleDateString()}</p>
              </div>
              <span className={`badge capitalize ${STATUS_STYLES[o.status] || ""}`}>{o.status}</span>
              <span className="font-semibold text-sm">{formatMoney(o.total_cents)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
