import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOrderById, getOrderItems } from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";
import CancelOrderButton from "@/components/CancelOrderButton";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("/account/orders");
  const { id } = await params;
  const order = getOrderById(id);
  if (!order || order.user_id !== user.id) notFound();
  const items = getOrderItems(order.id);

  const canCancel = order.status !== "shipped" && order.status !== "cancelled" && order.status !== "refunded";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold">Order {order.order_number}</h1>
        <span className="badge capitalize">{order.status}</span>
      </div>
      <p className="text-xs text-ink-muted mb-6">Placed {new Date(order.placed_at).toLocaleString()}</p>

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3">Items</h2>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between">
              <span>
                {i.title_snapshot} × {i.quantity}
              </span>
              <span>{formatMoney(i.unit_price_cents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border mt-3 pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotal_cents)}</span></div>
          <div className="flex justify-between"><span>Shipping ({order.shipping_option_name})</span><span>{formatMoney(order.shipping_cents)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{formatMoney(order.tax_cents)}</span></div>
          <div className="flex justify-between font-bold pt-1"><span>Total</span><span>{formatMoney(order.total_cents)}</span></div>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-2">Shipping Address</h2>
        <p className="text-sm">
          {order.shipping_name}
          <br />
          {order.shipping_line1}
          {order.shipping_line2 ? `, ${order.shipping_line2}` : ""}
          <br />
          {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
        </p>
      </div>

      {canCancel && (
        <div className="card p-5">
          <h2 className="font-semibold mb-1">Cancel this order</h2>
          <p className="text-xs text-ink-muted mb-2">Orders can only be cancelled before they ship.</p>
          <CancelOrderButton orderId={order.id} />
        </div>
      )}
    </div>
  );
}
