"use client";

import { updateCartItemAction } from "@/lib/actions/cart.actions";

export default function CartQuantitySelect({ productId, quantity, max }: { productId: string; quantity: number; max: number }) {
  return (
    <form action={updateCartItemAction} className="flex items-center gap-2">
      <input type="hidden" name="productId" value={productId} />
      <select
        name="quantity"
        defaultValue={quantity}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="field-input w-16"
        aria-label={`Quantity for ${productId}`}
      >
        {Array.from({ length: Math.max(max, quantity, 1) }, (_, i) => i + 1)
          .slice(0, 10)
          .map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
      </select>
    </form>
  );
}
