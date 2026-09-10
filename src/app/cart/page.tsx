import Link from "next/link";
import { getCurrentCartSummary } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { removeCartItemAction } from "@/lib/actions/cart.actions";
import CartQuantitySelect from "@/components/CartQuantitySelect";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const { lines, subtotalCents } = await getCurrentCartSummary();

  return (
    <div className="container-page py-10 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      {lines.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-ink-muted mb-4">Your cart is empty.</p>
          <Link href="/shop" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-3">
            {lines.map((line) => (
              <div key={line.productId} className="card p-4 flex gap-4 items-center">
                <div className="w-16 h-16 bg-surface-muted rounded flex items-center justify-center text-[10px] text-ink-muted shrink-0">
                  {line.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.imageUrl} alt={line.title} className="w-full h-full object-cover rounded" />
                  ) : (
                    line.format
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/shop/product/${line.productId}`} className="font-semibold text-sm hover:text-brand line-clamp-1">
                    {line.title}
                  </Link>
                  {line.artist && <p className="text-xs text-ink-muted">{line.artist}</p>}
                  <p className="text-sm font-bold text-brand mt-1">{formatMoney(line.unitPriceCents)}</p>
                </div>
                <CartQuantitySelect productId={line.productId} quantity={line.quantity} max={line.available} />
                <div className="text-right w-24">
                  <p className="font-semibold text-sm">{formatMoney(line.lineTotalCents)}</p>
                </div>
                <form action={removeCartItemAction}>
                  <input type="hidden" name="productId" value={line.productId} />
                  <button type="submit" className="text-xs text-danger hover:underline">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>

          <div className="card p-5 h-fit">
            <div className="flex justify-between text-sm mb-2">
              <span>Subtotal</span>
              <span className="font-semibold">{formatMoney(subtotalCents)}</span>
            </div>
            <p className="text-xs text-ink-muted mb-4">Tax and shipping calculated at checkout.</p>
            <Link href="/checkout" className="btn btn-primary w-full">
              Checkout
            </Link>
            <Link href="/shop" className="btn btn-secondary w-full mt-2">
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
