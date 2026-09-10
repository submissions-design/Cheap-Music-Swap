import { listAllOrders } from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";
import { markOrderShippedAction } from "@/lib/actions/listings.actions";

export default async function AdminOrdersPage() {
  const orders = listAllOrders();

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Orders</h1>
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
                <td className="py-2 pr-4">{o.guest_email || o.user_id}</td>
                <td className="py-2 pr-4">
                  <span className="badge capitalize">{o.status}</span>
                </td>
                <td className="py-2 pr-4">{formatMoney(o.total_cents)}</td>
                <td className="py-2 pr-4 text-ink-muted">{new Date(o.placed_at).toLocaleDateString()}</td>
                <td className="py-2 pr-4">
                  {o.status === "paid" && (
                    <form action={markOrderShippedAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <button type="submit" className="btn btn-secondary btn-sm">
                        Mark Shipped
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink-muted">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
