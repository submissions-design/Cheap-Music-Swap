import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { getUserById } from "./db/repo";
import type { User } from "./db/types";

export const SESSION_COOKIE = "cms_session";
export const GUEST_CART_COOKIE = "cms_guest_cart";

const secretValue = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me-before-deploying";
const secret = new TextEncoder().encode(secretValue);

if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.warn(
    "[auth] AUTH_SECRET is not set. Using an insecure default — set AUTH_SECRET in the environment before real deployment."
  );
}

interface SessionPayload {
  sub: string; // user id
  role: "customer" | "admin";
}

export async function createSessionToken(userId: string, role: "customer" | "admin"): Promise<string> {
  return new SignJWT({ role } satisfies Omit<SessionPayload, "sub">)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function readSessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub, role: (payload.role as "customer" | "admin") ?? "customer" };
  } catch {
    return null;
  }
}

/** Read the current session (if any) from the request cookies. Safe to call from Server Components, Server Actions, and Route Handlers. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

/** Full current user row, or null if not logged in. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  return getUserById(session.sub) ?? null;
}

/** Use in Server Actions / Route Handlers after a successful login to set the session cookie. */
export async function setSessionCookie(userId: string, role: "customer" | "admin") {
  const token = await createSessionToken(userId, role);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Redirects to /login if there is no session. Returns the logged-in user otherwise. */
export async function requireUser(nextPath?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser("/admin");
  if (user.role !== "admin") {
    redirect("/");
  }
  return user;
}

/** Ensures a guest cart token cookie exists and returns it. Call only from a Server Action or Route Handler (cookie writes aren't allowed during render). */
export async function getOrSetGuestCartToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_CART_COOKIE)?.value;
  if (existing) return existing;
  const token = randomUUID();
  store.set(GUEST_CART_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return token;
}

/** Read-only lookup of the guest cart token, for use during render (no cookie write). */
export async function peekGuestCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_CART_COOKIE)?.value ?? null;
}
