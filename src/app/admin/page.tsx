import { listAllOrders, listAllThreads, listPendingListings } from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";

export default async function AdminDashboard() {
  const orders = listAllOrders();
  const threads = listAllThreads();
  const pending = listPendingListings();
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total_cents, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-bold text-brand">{orders.length}</div>
          <div className="text-xs text-ink-muted">Total orders</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-brand">{formatMoney(revenue)}</div>
          <div className="text-xs text-ink-muted">Gross revenue</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-brand">{threads.filter((t) => t.status === "open").length}</div>
          <div className="text-xs text-ink-muted">Open message threads</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-brand">{pending.length}</div>
          <div className="text-xs text-ink-muted">Listings awaiting review</div>
        </div>
      </div>
    </div>
  );
}
