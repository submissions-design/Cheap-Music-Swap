"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  updateUserProfile,
  createAddress,
  deleteAddress,
  addPaymentMethod,
  deletePaymentMethod,
  cancelOrder,
} from "@/lib/db/repo";
import { getPaymentProvider } from "@/lib/payments";
import type { FormState } from "./auth.actions";

export async function updateProfileAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile");
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!firstName || !lastName) return { error: "First and last name are required." };
  updateUserProfile(user.id, { firstName, lastName, phone: phone || null });
  revalidatePath("/account/profile");
  return { success: "Profile updated." };
}

export async function addAddressAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile");
  const label = String(formData.get("label") || "Home").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const line1 = String(formData.get("line1") || "").trim();
  const line2 = String(formData.get("line2") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim().toUpperCase();
  const postalCode = String(formData.get("postalCode") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!fullName || !line1 || !city || !state || !postalCode) {
    return { error: "Please complete all required address fields." };
  }
  createAddress({
    user_id: user.id,
    label,
    full_name: fullName,
    line1,
    line2: line2 || null,
    city,
    state,
    postal_code: postalCode,
    country: "US",
    phone: phone || null,
    is_default_shipping: formData.get("isDefaultShipping") === "on" ? 1 : 0,
    is_default_billing: formData.get("isDefaultBilling") === "on" ? 1 : 0,
  });
  revalidatePath("/account/profile");
  return { success: "Address saved." };
}

export async function deleteAddressAction(formData: FormData) {
  const user = await requireUser("/account/profile");
  deleteAddress(String(formData.get("addressId") || ""), user.id);
  revalidatePath("/account/profile");
}

export async function addPaymentMethodAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/payment-methods");
  const cardNumber = String(formData.get("cardNumber") || "").replace(/\s+/g, "");
  const expMonth = Number(formData.get("expMonth") || 0);
  const expYear = Number(formData.get("expYear") || 0);
  const cvc = String(formData.get("cvc") || "");
  if (cardNumber.length < 12 || !expMonth || !expYear || cvc.length < 3) {
    return { error: "Enter a valid card number, expiration, and CVC." };
  }
  const last4 = cardNumber.slice(-4);
  const cardBrand = cardNumber.startsWith("4") ? "Visa" : cardNumber.startsWith("5") ? "Mastercard" : "Card";
  addPaymentMethod({
    user_id: user.id,
    label: `${cardBrand} ending in ${last4}`,
    card_brand: cardBrand,
    last4,
    exp_month: expMonth,
    exp_year: expYear,
    billing_address_id: null,
    processor: getPaymentProvider().name,
    processor_token: `TOK-${cardNumber.slice(-8)}`,
    is_default: formData.get("isDefault") === "on" ? 1 : 0,
  });
  revalidatePath("/account/payment-methods");
  return { success: "Payment method saved." };
}

export async function deletePaymentMethodAction(formData: FormData) {
  const user = await requireUser("/account/payment-methods");
  deletePaymentMethod(String(formData.get("methodId") || ""), user.id);
  revalidatePath("/account/payment-methods");
}

export async function cancelOrderAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/orders");
  const orderId = String(formData.get("orderId") || "");
  const result = cancelOrder(orderId, user.id);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  if (!result.ok) return { error: result.reason };
  return { success: "Order cancelled." };
}
