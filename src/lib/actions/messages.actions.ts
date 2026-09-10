"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { createMessageThread, addMessageToThread, getThreadById } from "@/lib/db/repo";
import type { FormState } from "./auth.actions";

export async function sendNewMessageAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const guestEmail = String(formData.get("guestEmail") || "").trim();
  const guestName = String(formData.get("guestName") || "").trim();

  if (!subject || !body) return { error: "Please fill in a subject and message." };
  if (!user && (!guestEmail || !guestName)) return { error: "Please include your name and email." };

  createMessageThread({
    userId: user?.id ?? null,
    guestEmail: user ? null : guestEmail,
    guestName: user ? null : guestName,
    subject,
    body,
  });

  revalidatePath("/account/messages");
  return { success: "Your message has been sent to our team." };
}

export async function replyToThreadAction(formData: FormData) {
  const user = await getCurrentUser();
  const threadId = String(formData.get("threadId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  const thread = getThreadById(threadId);
  if (!thread) return;

  const isAdmin = user?.role === "admin";
  if (!isAdmin && thread.user_id !== user?.id) return; // not this customer's thread

  addMessageToThread(threadId, isAdmin ? "admin" : "customer", body);
  revalidatePath(isAdmin ? `/admin/messages/${threadId}` : `/account/messages/${threadId}`);
}

export async function adminReplyAction(formData: FormData) {
  await requireAdmin();
  const threadId = String(formData.get("threadId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  addMessageToThread(threadId, "admin", body);
  revalidatePath(`/admin/messages/${threadId}`);
  redirect(`/admin/messages/${threadId}`);
}
