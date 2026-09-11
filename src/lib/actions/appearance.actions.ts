"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { setHeaderBackgroundImage } from "@/lib/db/repo";
import { saveUploadedImage } from "@/lib/uploads";
import type { FormState } from "./auth.actions";

export async function updateHeaderBackgroundAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  let imageUrl: string | null;
  try {
    imageUrl = await saveUploadedImage(formData.get("headerBgImage") as File | null, "site");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save the image." };
  }

  if (!imageUrl) {
    return { error: "Choose an image to upload first." };
  }

  setHeaderBackgroundImage(imageUrl);
  revalidatePath("/", "layout");
  revalidatePath("/admin/appearance");
  return { success: "Header background updated." };
}

export async function removeHeaderBackgroundAction(formData: FormData) {
  await requireAdmin();
  void formData;
  setHeaderBackgroundImage(null);
  revalidatePath("/", "layout");
  revalidatePath("/admin/appearance");
}
