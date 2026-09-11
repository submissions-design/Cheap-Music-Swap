import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOrderById,
  getOrderItems,
  listCarriers,
  getCarrierById,
  buildTrackingUrl,
  listThreadsForOrder,
  getMessagesForThread,
} from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";
import ShipOrderForm from "@/components/admin/ShipOrderForm";
import OrderMessageForm from "@/components/admin/OrderMessageForm";
import { setOrderStatusAction } from "@/lib/actions/admin-orders.actions";

const STATUSES = ["processing", "paid", "shipped", "cancelled", "refunded"];

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) notFound();

  const items = getOrderItems(order.id);
  const carriers = listCarriers(true);
  const currentCarrier = order.carrier_id ? getCarrierById(order.carrier_id) : undefined;
  const trackingUrl = buildTrackingUrl(currentCarrier, order.tracking_number);
  const threads = listThreadsForOrder(order.id);
  const messagesByThread = threads.map((t) => ({ thread: t, messages: getMessagesForThread(t.id) }));

  return (
    <div className="max-w-3xl">
      <Link href="/admin/orders" className="text-sm text-ink-muted hover:underline">
        &larr; Back to Orders
      </Link>

      <div className="flex items-center justify-between my-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Order {order.order_number}</h1>
          <p className="text-xs text-ink-muted">Placed {new Date(order.placed_at).toLocaleString()}</p>
        </div>
        <span className="badge capitalize">{order.status}</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="card p-5">
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

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold mb-2">Customer &amp; Shipping Address</h2>
            <p className="text-sm text-ink-muted mb-1">
              {order.guest_email ? `${order.guest_email} (guest)` : "Registered customer"}
            </p>
            <p className="text-sm">
              {order.shipping_name}
              <br />
              {order.shipping_line1}
              {order.shipping_line2 ? `, ${order.shipping_line2}` : ""}
              <br />
              {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
            </p>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-2">Status</h2>
            <form action={setOrderStatusAction} className="flex items-center gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <select name="status" defaultValue={order.status} className="field-input py-1">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-secondary btn-sm">
                Update
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3">Shipping &amp; Tracking</h2>
        {order.tracking_number && currentCarrier && (
          <p className="text-sm mb-3">
            Currently: {currentCarrier.name} — {order.tracking_number}
            {trackingUrl && (
              <>
                {" · "}
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                  Track &rarr;
                </a>
              </>
            )}
          </p>
        )}
        <ShipOrderForm
          orderId={order.id}
          carriers={carriers}
          currentCarrierId={order.carrier_id}
          currentTrackingNumber={order.tracking_number}
        />
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Message Customer About This Order</h2>
        {messagesByThread.length > 0 && (
          <div className="space-y-2 mb-4">
            {messagesByThread.flatMap(({ thread, messages }) =>
              messages.map((m) => (
                <div key={m.id} className={`p-3 rounded border border-border max-w-[85%] ${m.sender === "admin" ? "ml-auto bg-surface-muted" : ""}`}>
                  <p className="text-xs text-ink-muted mb-1">
                    {m.sender === "admin" ? "You" : "Customer"} · {new Date(m.created_at).toLocaleString()}
                    {threads.length > 1 ? ` · ${thread.subject}` : ""}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                </div>
              ))
            )}
          </div>
        )}
        <OrderMessageForm orderId={order.id} />
      </div>
    </div>
  );
}
