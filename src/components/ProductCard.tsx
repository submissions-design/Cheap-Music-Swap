import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/db/types";

export default function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.quantity <= 0;
  return (
    <Link
      href={`/shop/product/${product.id}`}
      className="card flex flex-col overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-surface-muted flex items-center justify-center text-ink-muted text-xs relative">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <span className="px-4 text-center">{product.format}</span>
        )}
        {product.is_seller_listing ? <span className="badge absolute top-2 left-2 bg-surface">Marketplace</span> : null}
        {outOfStock ? (
          <span className="badge absolute top-2 right-2 bg-surface text-danger">Sold Out</span>
        ) : null}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <span className="badge w-fit">{product.format}</span>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{product.title}</h3>
        {product.artist ? <p className="text-xs text-ink-muted line-clamp-1">{product.artist}</p> : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-bold text-brand">{formatMoney(product.price_cents)}</span>
          <span className="text-xs text-ink-muted">{product.condition}</span>
        </div>
      </div>
    </Link>
  );
}
