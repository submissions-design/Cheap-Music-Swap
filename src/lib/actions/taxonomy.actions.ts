"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createGenre,
  updateGenre,
  deleteGenre,
  createArtist,
  deleteArtist,
} from "@/lib/db/repo";

const PATH = "/admin/categories";

// --- Categories ---------------------------------------------------------

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (name) createCategory(name);
  revalidatePath(PATH);
}

export async function renameCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (id && name) updateCategory(id, { name });
  revalidatePath(PATH);
}

export async function toggleCategoryActiveAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const isActive = String(formData.get("isActive") || "0") === "1" ? 1 : 0;
  updateCategory(id, { is_active: isActive ? 0 : 1 });
  revalidatePath(PATH);
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) deleteCategory(id);
  revalidatePath(PATH);
}

// --- Genres ---------------------------------------------------------

export async function createGenreAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (name) createGenre(name);
  revalidatePath(PATH);
}

export async function renameGenreAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (id && name) updateGenre(id, { name });
  revalidatePath(PATH);
}

export async function toggleGenreActiveAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const isActive = String(formData.get("isActive") || "0") === "1" ? 1 : 0;
  updateGenre(id, { is_active: isActive ? 0 : 1 });
  revalidatePath(PATH);
}

export async function deleteGenreAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) deleteGenre(id);
  revalidatePath(PATH);
}

// --- Artists ---------------------------------------------------------

export async function createArtistAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (name) createArtist(name);
  revalidatePath(PATH);
}

export async function deleteArtistAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) deleteArtist(id);
  revalidatePath(PATH);
}
