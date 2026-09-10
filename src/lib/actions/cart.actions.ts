"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOrCreateCurrentCartId } from "@/lib/cart";
import { addItemToCart, updateCartItemQuantity, removeCartItem, getProductById } from "@/lib/db/repo";

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const quantity = Math.max(1, Number(formData.get("quantity") || 1));
  const product = getProductById(productId);
  if (!product || product.status !== "active") return;

  const cartId = await getOrCreateCurrentCartId();
  addItemToCart(cartId, productId, quantity);
  revalidatePath("/cart");
  revalidatePath("/", "layout");

  const redirectTo = String(formData.get("redirectTo") || "");
  if (redirectTo) redirect(redirectTo);
}

export async function updateCartItemAction(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const quantity = Math.max(0, Number(formData.get("quantity") || 0));
  const cartId = await getOrCreateCurrentCartId();
  updateCartItemQuantity(cartId, productId, quantity);
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function removeCartItemAction(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const cartId = await getOrCreateCurrentCartId();
  removeCartItem(cartId, productId);
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}
