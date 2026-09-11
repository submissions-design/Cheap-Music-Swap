"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  createProductAdmin,
  updateProduct,
  setProductQuantity,
  deleteProductAdmin,
  getProductById,
} from "@/lib/db/repo";
import { saveUploadedImage } from "@/lib/uploads";
import type { FormState } from "./auth.actions";

const CONDITIONS = ["New", "Used - Like New", "Used - Good", "Used - Fair"];
const STATUSES = ["active", "pending_approval", "rejected", "inactive"];

function parseCommon(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const artist = String(formData.get("artist") || "").trim();
  const format = String(formData.get("format") || "").trim();
  const genre = String(formData.get("genre") || "").trim();
  const condition = String(formData.get("condition") || "").trim();
  const priceDollars = Number(formData.get("price") || 0);
  const quantity = Math.max(0, Number(formData.get("quantity") || 0));
  const description = String(formData.get("description") || "").trim();
  return { title, artist, format, genre, condition, priceDollars, quantity, description };
}

export async function createProductAdminAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const { title, artist, format, genre, condition, priceDollars, quantity, description } = parseCommon(formData);

  if (!title || !format || !condition) {
    return { error: "Title, category, and condition are required." };
  }
  if (!CONDITIONS.includes(condition)) return { error: "Choose a valid condition." };
  if (!priceDollars || priceDollars <= 0) return { error: "Enter a price greater than $0." };

  let imageUrl: string | null = null;
  try {
    imageUrl = await saveUploadedImage(formData.get("coverImage") as File | null, "products");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save the cover image." };
  }

  const product = createProductAdmin({
    title,
    artist: artist || null,
    format,
    genre: genre || null,
    condition,
    priceCents: Math.round(priceDollars * 100),
    quantity,
    description: description || null,
    imageUrl,
  });

  revalidatePath("/admin/inventory");
  redirect(`/admin/inventory/${product.id}?created=1`);
}

export async function updateProductAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("productId") || "");
  const current = getProductById(id);
  if (!current) return { error: "Product not found." };

  const { title, artist, format, genre, condition, priceDollars, quantity, description } = parseCommon(formData);
  const status = String(formData.get("status") || current.status);

  if (!title || !format || !condition) {
    return { error: "Title, category, and condition are required." };
  }
  if (!CONDITIONS.includes(condition)) return { error: "Choose a valid condition." };
  if (!STATUSES.includes(status)) return { error: "Choose a valid status." };
  if (!priceDollars || priceDollars <= 0) return { error: "Enter a price greater than $0." };

  let imageUrl: string | undefined = undefined;
  try {
    const saved = await saveUploadedImage(formData.get("coverImage") as File | null, "products");
    if (saved) imageUrl = saved; // leave unchanged if no new file was uploaded
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save the cover image." };
  }

  updateProduct(id, {
    title,
    artist: artist || null,
    format,
    genre: genre || null,
    condition,
    priceCents: Math.round(priceDollars * 100),
    quantity,
    description: description || null,
    imageUrl,
    status,
  });

  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${id}`);
  revalidatePath(`/products/${id}`);
  return { success: "Product updated." };
}

export async function setProductQuantityAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("productId") || "");
  const quantity = Math.max(0, Number(formData.get("quantity") || 0));
  setProductQuantity(id, quantity);
  revalidatePath("/admin/inventory");
}

export async function deleteProductAdminAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("productId") || "");
  deleteProductAdmin(id);
  revalidatePath("/admin/inventory");
  redirect("/admin/inventory");
}
