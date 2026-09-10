"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth";
import { createSellerListing, setListingStatus, markOrderShipped } from "@/lib/db/repo";
import type { FormState } from "./auth.actions";

const FORMATS = ["CD", "Vinyl", "Cassette", "Turntable", "Accessory", "Other"];
const CONDITIONS = ["New", "Used - Like New", "Used - Good", "Used - Fair"];

export async function createListingAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/sell");

  const title = String(formData.get("title") || "").trim();
  const artist = String(formData.get("artist") || "").trim();
  const format = String(formData.get("format") || "").trim();
  const genre = String(formData.get("genre") || "").trim();
  const condition = String(formData.get("condition") || "").trim();
  const priceDollars = Number(formData.get("price") || 0);
  const quantity = Math.max(1, Number(formData.get("quantity") || 1));
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();

  if (!title || !format || !condition || !description) {
    return { error: "Title, format, condition, and description are required." };
  }
  if (!FORMATS.includes(format)) return { error: "Choose a valid format." };
  if (!CONDITIONS.includes(condition)) return { error: "Choose a valid condition." };
  if (!priceDollars || priceDollars <= 0) return { error: "Enter a price greater than $0." };

  createSellerListing({
    sellerUserId: user.id,
    title,
    artist: artist || null,
    format,
    genre: genre || null,
    condition,
    priceCents: Math.round(priceDollars * 100),
    quantity,
    description,
    imageUrl: imageUrl || null,
  });

  revalidatePath("/account/sell");
  return { success: "Your listing was submitted and is pending admin approval." };
}

export async function approveListingAction(formData: FormData) {
  await requireAdmin();
  setListingStatus(String(formData.get("productId") || ""), "active");
  revalidatePath("/admin/listings");
}

export async function rejectListingAction(formData: FormData) {
  await requireAdmin();
  const note = String(formData.get("note") || "").trim();
  setListingStatus(String(formData.get("productId") || ""), "rejected", note || undefined);
  revalidatePath("/admin/listings");
}

export async function markOrderShippedAction(formData: FormData) {
  await requireAdmin();
  markOrderShipped(String(formData.get("orderId") || ""));
  revalidatePath("/admin/orders");
}
