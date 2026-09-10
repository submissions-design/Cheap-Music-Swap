import Link from "next/link";
import { listRecentProducts, countByFormat } from "@/lib/db/repo";
import ProductGrid from "@/components/ProductGrid";

export default async function HomePage() {
  const [recent, formats] = await Promise.all([
    Promise.resolve(listRecentProducts(8)),
    Promise.resolve(countByFormat()),
  ]);

  return (
    <div>
      <section className="bg-surface-muted border-b border-border">
        <div className="container-page py-14 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight mb-4">
              Thousands of CDs &amp; vinyl.
              <br />
              One shop to swap them all.
            </h1>
            <p className="text-ink-muted text-lg mb-6">
              New and pre-owned CDs, vinyl records, turntables, and accessories — plus a marketplace where you can
              list your own music for sale.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary">
                Shop the Catalog
              </Link>
              <Link href="/account/sell" className="btn btn-secondary">
                Sell Your Music
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {formats.slice(0, 6).map((f) => (
              <Link
                key={f.format}
                href={`/shop?format=${encodeURIComponent(f.format)}`}
                className="card p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-2xl font-bold text-brand">{f.count}</div>
                <div className="text-xs text-ink-muted mt-1">{f.format}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Recently Added</h2>
          <Link href="/shop" className="text-sm text-brand hover:underline">
            View all →
          </Link>
        </div>
        <ProductGrid products={recent} />
      </section>
    </div>
  );
}
