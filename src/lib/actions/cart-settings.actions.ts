"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  createShippingOption,
  updateShippingOption,
  deleteShippingOption,
  createCarrier,
  updateCarrier,
  deleteCarrier,
} from "@/lib/db/repo";

const PATH = "/admin/settings";

// --- Tax rates ---------------------------------------------------------

export async function createTaxRateAction(formData: FormData) {
  await requireAdmin();
  const stateCode = String(formData.get("stateCode") || "").trim();
  const ratePercent = Number(formData.get("ratePercent") || 0);
  const label = String(formData.get("label") || "").trim();
  if (stateCode && label) createTaxRate({ stateCode, ratePercent, label });
  revalidatePath(PATH);
}

export async function updateTaxRateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const stateCode = String(formData.get("stateCode") || "").trim();
  const ratePercent = Number(formData.get("ratePercent") || 0);
  const label = String(formData.get("label") || "").trim();
  if (id && stateCode && label) updateTaxRate(id, { stateCode, ratePercent, label });
  revalidatePath(PATH);
}

export async function deleteTaxRateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) deleteTaxRate(id);
  revalidatePath(PATH);
}

// --- Shipping options ---------------------------------------------------------

export async function createShippingOptionAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const flatRateDollars = Number(formData.get("flatRate") || 0);
  const sortOrder = Number(formData.get("sortOrder") || 0);
  if (name) {
    createShippingOption({
      name,
      description: description || null,
      flatRateCents: Math.round(flatRateDollars * 100),
      isActive: true,
      sortOrder,
    });
  }
  revalidatePath(PATH);
}

export async function updateShippingOptionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const flatRateDollars = Number(formData.get("flatRate") || 0);
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const isActive = formData.get("isActive") === "on";
  if (id && name) {
    updateShippingOption(id, {
      name,
      description: description || null,
      flatRateCents: Math.round(flatRateDollars * 100),
      isActive,
      sortOrder,
    });
  }
  revalidatePath(PATH);
}

export async function deleteShippingOptionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) deleteShippingOption(id);
  revalidatePath(PATH);
}

// --- Carriers ---------------------------------------------------------

export async function createCarrierAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const template = String(formData.get("trackingUrlTemplate") || "").trim();
  if (name) createCarrier({ name, tracking_url_template: template || null });
  revalidatePath(PATH);
}

export async function updateCarrierAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const template = String(formData.get("trackingUrlTemplate") || "").trim();
  const isActive = formData.get("isActive") === "on" ? 1 : 0;
  if (id && name) updateCarrier(id, { name, tracking_url_template: template || null, is_active: isActive });
  revalidatePath(PATH);
}

export async function deleteCarrierAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) deleteCarrier(id);
  revalidatePath(PATH);
}
