"use client";

import { deleteProductAdminAction } from "@/lib/actions/admin-products.actions";

export default function DeleteProductButton({ productId }: { productId: string }) {
  return (
    <form
      action={deleteProductAdminAction}
      onSubmit={(e) => {
        if (!confirm("Delete this product permanently? This can't be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <button type="submit" className="btn btn-danger btn-sm">
        Delete Product
      </button>
    </form>
  );
}
