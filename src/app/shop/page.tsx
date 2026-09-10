import { listProducts } from "@/lib/db/repo";
import CategorySidebar from "@/components/CategorySidebar";
import ProductGrid from "@/components/ProductGrid";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string; format?: string; genre?: string; artist?: string; category?: string; page?: string };

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));

  const { items, total, pageSize } = listProducts({
    q: sp.q,
    format: sp.format,
    genre: sp.genre,
    artist: sp.artist,
    category: sp.category as "accessories" | "other" | undefined,
    page,
  });

  const heading = sp.q
    ? `Search results for "${sp.q}"`
    : sp.format
      ? sp.format
      : sp.genre
        ? sp.genre
        : sp.artist
          ? sp.artist
          : sp.category === "accessories"
            ? "Accessories"
            : sp.category === "other"
              ? "Other"
              : "Browse All";

  return (
    <div className="container-page py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <CategorySidebar active={{ format: sp.format, genre: sp.genre, artist: sp.artist, category: sp.category }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">{heading}</h1>
            <span className="text-sm text-ink-muted">{total} item{total === 1 ? "" : "s"}</span>
          </div>
          <ProductGrid products={items} />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            basePath="/shop"
            searchParams={{ q: sp.q, format: sp.format, genre: sp.genre, artist: sp.artist, category: sp.category }}
          />
        </div>
      </div>
    </div>
  );
}
