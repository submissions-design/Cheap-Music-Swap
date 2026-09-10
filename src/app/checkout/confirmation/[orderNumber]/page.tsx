import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByNumber, getOrderItems } from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";

export default async function ConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = getOrderByNumber(orderNumber);
  if (!order) notFound();
  const items = getOrderItems(order.id);

  return (
    <div className="container-page py-14 max-w-2xl">
      <div className="alert-success mb-6">Thank you! Your order has been placed.</div>
      <h1 className="text-2xl font-bold mb-1">Order {order.order_number}</h1>
      <p className="text-ink-muted mb-6">A confirmation has been sent to {order.guest_email || "your account email"}.</p>

      <div className="card p-5 mb-6">
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
          <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>{formatMoney(order.total_cents)}</span></div>
        </div>
      </div>

      <div className="card p-5 mb-8">
        <h2 className="font-semibold mb-2">Shipping To</h2>
        <p className="text-sm">
          {order.shipping_name}
          <br />
          {order.shipping_line1}
          {order.shipping_line2 ? `, ${order.shipping_line2}` : ""}
          <br />
          {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
        </p>
      </div>

      <Link href="/shop" className="btn btn-primary">
        Continue Shopping
      </Link>
    </div>
  );
}
