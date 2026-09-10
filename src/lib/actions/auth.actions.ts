"use server";

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createUser,
  getUserByEmail,
  verifyUserByToken,
  mergeGuestCartIntoUser,
} from "@/lib/db/repo";
import { setSessionCookie, clearSessionCookie, peekGuestCartToken } from "@/lib/auth";
import { sendEmail, verificationEmailText } from "@/lib/mailer";

export interface FormState {
  error?: string;
  success?: string;
}

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function registerAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check the form and try again." };
  }
  const { firstName, lastName, email, phone, password } = parsed.data;

  if (getUserByEmail(email)) {
    return { error: "An account with that email already exists. Try logging in instead." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = randomUUID();
  const user = createUser({ email, passwordHash, firstName, lastName, phone: phone ?? null, verificationToken });

  const verifyUrl = `${process.env.APP_URL || "http://localhost:3000"}/register/verify?token=${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: "Confirm your Cheap Music Swap account",
    text: verificationEmailText(user.first_name, verifyUrl),
  });

  await setSessionCookie(user.id, user.role);
  const guestToken = await peekGuestCartToken();
  if (guestToken) mergeGuestCartIntoUser(guestToken, user.id);

  redirect("/register/check-email");
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function loginAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check the form and try again." };
  }
  const { email, password } = parsed.data;
  const user = getUserByEmail(email);
  if (!user) return { error: "No account found with that email." };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return { error: "Incorrect password." };

  await setSessionCookie(user.id, user.role);
  const guestToken = await peekGuestCartToken();
  if (guestToken) mergeGuestCartIntoUser(guestToken, user.id);

  const next = String(formData.get("next") || "");
  redirect(next && next.startsWith("/") ? next : user.role === "admin" ? "/admin" : "/account");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

export async function verifyEmailAction(token: string): Promise<{ ok: boolean }> {
  const user = verifyUserByToken(token);
  return { ok: !!user };
}
