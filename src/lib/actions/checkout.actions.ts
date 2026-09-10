"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateCurrentCartId } from "@/lib/cart";
import {
  getCartLines,
  clearCart,
  getTaxRateForState,
  getShippingOptionById,
  createOrder,
  addPaymentMethod,
  listPaymentMethods,
} from "@/lib/db/repo";
import { calcTaxCents } from "@/lib/money";
import { getPaymentProvider } from "@/lib/payments";
import { formatMoney } from "@/lib/money";
import { sendEmail, orderConfirmationEmailText } from "@/lib/mailer";
import type { FormState } from "./auth.actions";

export async function placeOrderAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const cartId = await getOrCreateCurrentCartId();
  const lines = getCartLines(cartId);
  if (lines.length === 0) return { error: "Your cart is empty." };

  const guestEmail = String(formData.get("guestEmail") || "").trim();
  if (!user && !guestEmail) return { error: "Enter an email address to check out as a guest, or log in." };

  const shippingName = String(formData.get("shippingName") || "").trim();
  const line1 = String(formData.get("line1") || "").trim();
  const line2 = String(formData.get("line2") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim().toUpperCase();
  const postalCode = String(formData.get("postalCode") || "").trim();
  const country = String(formData.get("country") || "US").trim();
  const shippingOptionId = String(formData.get("shippingOptionId") || "");

  if (!shippingName || !line1 || !city || !state || !postalCode) {
    return { error: "Please complete the shipping address." };
  }

  const shippingOption = getShippingOptionById(shippingOptionId);
  if (!shippingOption) return { error: "Choose a shipping option." };

  // Payment: either an existing saved method (logged-in users) or new card
  // details entered at checkout (captured only as brand/last4/expiry — see
  // lib/payments for why full card data never reaches this server).
  let paymentToken = "";
  let cardBrand = "";
  let last4 = "";
  const existingMethodId = String(formData.get("paymentMethodId") || "");
  if (user && existingMethodId) {
    const method = listPaymentMethods(user.id).find((m) => m.id === existingMethodId);
    if (!method) return { error: "Select a valid payment method." };
    paymentToken = method.processor_token;
    cardBrand = method.card_brand;
    last4 = method.last4;
  } else {
    const cardNumber = String(formData.get("cardNumber") || "").replace(/\s+/g, "");
    const expMonth = Number(formData.get("expMonth") || 0);
    const expYear = Number(formData.get("expYear") || 0);
    const cvc = String(formData.get("cvc") || "");
    if (cardNumber.length < 12 || !expMonth || !expYear || cvc.length < 3) {
      return { error: "Enter a valid card number, expiration, and CVC." };
    }
    last4 = cardNumber.slice(-4);
    cardBrand = cardNumber.startsWith("4") ? "Visa" : cardNumber.startsWith("5") ? "Mastercard" : "Card";
    paymentToken = `TOK-${cardNumber.slice(-8)}`;

    if (user && formData.get("saveCard") === "on") {
      addPaymentMethod({
        user_id: user.id,
        label: `${cardBrand} ending in ${last4}`,
        card_brand: cardBrand,
        last4,
        exp_month: expMonth,
        exp_year: expYear,
        billing_address_id: null,
        processor: getPaymentProvider().name,
        processor_token: paymentToken,
        is_default: listPaymentMethods(user.id).length === 0 ? 1 : 0,
      });
    }
  }

  const subtotalCents = lines.reduce((n, l) => n + l.lineTotalCents, 0);
  const taxRate = getTaxRateForState(state);
  const taxCents = calcTaxCents(subtotalCents, taxRate?.rate_percent ?? 0);
  const shippingCents = shippingOption.flat_rate_cents;
  const totalCents = subtotalCents + taxCents + shippingCents;

  const provider = getPaymentProvider();
  const chargeResult = await provider.charge({
    amountCents: totalCents,
    currency: "usd",
    paymentMethodToken: paymentToken,
    orderReference: shippingName,
    customerEmail: user?.email || guestEmail,
  });

  if (!chargeResult.success) {
    return { error: chargeResult.errorMessage || "The payment could not be processed. Please check your card details." };
  }

  const order = createOrder({
    userId: user?.id ?? null,
    guestEmail: user ? null : guestEmail,
    lines,
    taxCents,
    shippingCents,
    shippingAddress: { name: shippingName, line1, line2: line2 || null, city, state, postalCode, country },
    shippingOptionName: shippingOption.name,
    paymentProcessor: provider.name,
    paymentReference: chargeResult.processorReference,
  });

  clearCart(cartId);

  await sendEmail({
    to: user?.email || guestEmail,
    subject: `Your Cheap Music Swap order ${order.order_number}`,
    text: orderConfirmationEmailText(user?.first_name || shippingName.split(" ")[0] || "there", order.order_number, formatMoney(totalCents)),
  });

  redirect(`/checkout/confirmation/${order.order_number}`);
}
