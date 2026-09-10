import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductById } from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";
import { addToCartAction } from "@/lib/actions/cart.actions";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product || product.status !== "active") notFound();

  const outOfStock = product.quantity <= 0;

  return (
    <div className="container-page py-10">
      <nav className="text-xs text-ink-muted mb-6">
        <Link href="/shop" className="hover:text-brand">
          Shop
        </Link>{" "}
        / <Link href={`/shop?format=${encodeURIComponent(product.format)}`} className="hover:text-brand">{product.format}</Link> /{" "}
        <span>{product.title}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square card bg-surface-muted flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-ink-muted">{product.format}</span>
          )}
        </div>

        <div>
          <span className="badge mb-3">{product.format}</span>
          {product.is_seller_listing ? <span className="badge ml-2 mb-3">Marketplace Listing</span> : null}
          <h1 className="text-2xl font-bold mb-1">{product.title}</h1>
          {product.artist && <p className="text-ink-muted mb-4">{product.artist}</p>}
          <div className="text-3xl font-bold text-brand mb-4">{formatMoney(product.price_cents)}</div>

          <dl className="grid grid-cols-2 gap-y-1 text-sm mb-6 max-w-sm">
            <dt className="text-ink-muted">Condition</dt>
            <dd>{product.condition}</dd>
            {product.genre && (
              <>
                <dt className="text-ink-muted">Genre</dt>
                <dd>{product.genre}</dd>
              </>
            )}
            <dt className="text-ink-muted">Availability</dt>
            <dd>{outOfStock ? <span className="text-danger">Sold out</span> : `${product.quantity} in stock`}</dd>
            <dt className="text-ink-muted">SKU</dt>
            <dd>{product.sku}</dd>
          </dl>

          {product.description && <p className="text-sm mb-6 max-w-prose">{product.description}</p>}

          <form action={addToCartAction} className="flex items-center gap-3">
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="redirectTo" value="/cart" />
            <label className="sr-only" htmlFor="quantity">
              Quantity
            </label>
            <select id="quantity" name="quantity" defaultValue={1} className="field-input w-20" disabled={outOfStock}>
              {Array.from({ length: Math.min(10, Math.max(product.quantity, 1)) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary" disabled={outOfStock}>
              {outOfStock ? "Sold Out" : "Add to Cart"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
