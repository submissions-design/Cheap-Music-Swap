"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  getOrderById,
  getUserById,
  getCarrierById,
  setOrderShipment,
  setOrderStatus,
  buildTrackingUrl,
  startOrContinueOrderThread,
} from "@/lib/db/repo";
import { sendEmail, shipmentTrackingEmailText, orderMessageEmailText } from "@/lib/mailer";
import type { FormState } from "./auth.actions";

const ORDER_STATUSES = ["processing", "paid", "shipped", "cancelled", "refunded"];

function customerEmail(order: { user_id: string | null; guest_email: string | null }): string | null {
  if (order.guest_email) return order.guest_email;
  if (order.user_id) return getUserById(order.user_id)?.email ?? null;
  return null;
}

function customerFirstName(order: { user_id: string | null; shipping_name: string }): string {
  if (order.user_id) {
    const u = getUserById(order.user_id);
    if (u) return u.first_name;
  }
  return order.shipping_name.split(" ")[0] || "there";
}

export async function shipOrderAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  const carrierId = String(formData.get("carrierId") || "") || null;
  const trackingNumber = String(formData.get("trackingNumber") || "").trim() || null;

  const order = getOrderById(orderId);
  if (!order) return { error: "Order not found." };
  if (!carrierId || !trackingNumber) return { error: "Choose a carrier and enter a tracking number." };

  setOrderShipment(orderId, carrierId, trackingNumber);

  const carrier = getCarrierById(carrierId);
  const email = customerEmail(order);
  if (email && carrier) {
    const trackingUrl = buildTrackingUrl(carrier, trackingNumber);
    await sendEmail({
      to: email,
      subject: `Your order ${order.order_number} has shipped`,
      text: shipmentTrackingEmailText(customerFirstName(order), order.order_number, carrier.name, trackingNumber, trackingUrl),
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: "Order marked shipped and tracking email sent." };
}

export async function setOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  if (orderId && ORDER_STATUSES.includes(status)) {
    setOrderStatus(orderId, status);
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function sendOrderMessageAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!body) return { error: "Write a message first." };

  const order = getOrderById(orderId);
  if (!order) return { error: "Order not found." };

  startOrContinueOrderThread({
    orderId,
    userId: order.user_id,
    guestEmail: order.guest_email,
    guestName: order.user_id ? null : order.shipping_name,
    subject: `About your order ${order.order_number}`,
    body,
  });

  const email = customerEmail(order);
  if (email) {
    await sendEmail({
      to: email,
      subject: `New message about your order ${order.order_number}`,
      text: orderMessageEmailText(customerFirstName(order), order.order_number, body),
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: "Message sent to the customer." };
}
