import Link from "next/link";
import { listOrdersForAdmin } from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const view = sp.view === "open" ? "open" : "all";
  const q = sp.q || "";

  const orders = listOrdersForAdmin({ view, q });
  const openCount = listOrdersForAdmin({ view: "open" }).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-xl font-bold">Orders</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/orders?view=all" className={`btn btn-sm ${view === "all" ? "btn-primary" : "btn-secondary"}`}>
            All
          </Link>
          <Link href="/admin/orders?view=open" className={`btn btn-sm ${view === "open" ? "btn-primary" : "btn-secondary"}`}>
            Open ({openCount})
          </Link>
        </div>
      </div>

      <form className="mb-4 flex gap-2">
        <input type="hidden" name="view" value={view} />
        <input name="q" defaultValue={q} placeholder="Order #, customer name, or email" className="field-input max-w-sm" />
        <button type="submit" className="btn btn-secondary btn-sm">
          Search
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs text-ink-muted border-b border-border">
              <th className="py-2 pr-4">Order #</th>
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Placed</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border">
                <td className="py-2 pr-4 font-medium">{o.order_number}</td>
                <td className="py-2 pr-4">{o.shipping_name}</td>
                <td className="py-2 pr-4">
                  <span className="badge capitalize">{o.status}</span>
                </td>
                <td className="py-2 pr-4">{formatMoney(o.total_cents)}</td>
                <td className="py-2 pr-4 text-ink-muted">{new Date(o.placed_at).toLocaleDateString()}</td>
                <td className="py-2 pr-4">
                  <Link href={`/admin/orders/${o.id}`} className="btn btn-secondary btn-sm">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink-muted">
                  No orders match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
