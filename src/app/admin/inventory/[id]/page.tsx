import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById, listCategories, listGenres, listArtists } from "@/lib/db/repo";
import ProductForm from "@/components/admin/ProductForm";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const product = getProductById(id);
  if (!product) notFound();

  const [categories, genres, artists] = [listCategories(), listGenres(), listArtists()];

  return (
    <div>
      <Link href="/admin/inventory" className="text-sm text-ink-muted hover:underline">
        &larr; Back to Inventory
      </Link>
      <div className="flex items-center justify-between my-4 flex-wrap gap-2">
        <h1 className="text-xl font-bold">Edit Product</h1>
        <DeleteProductButton productId={product.id} />
      </div>
      {created === "1" && <p className="alert-success mb-4">Product created.</p>}
      <ProductForm product={product} categories={categories} genres={genres} artists={artists} />
    </div>
  );
}
