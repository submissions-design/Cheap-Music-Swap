import Link from "next/link";
import { listCategories, listGenres, listArtists } from "@/lib/db/repo";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const [categories, genres, artists] = [listCategories(), listGenres(), listArtists()];

  return (
    <div>
      <Link href="/admin/inventory" className="text-sm text-ink-muted hover:underline">
        &larr; Back to Inventory
      </Link>
      <h1 className="text-xl font-bold my-4">Add Product</h1>
      <ProductForm categories={categories} genres={genres} artists={artists} />
    </div>
  );
}
