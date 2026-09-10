import { getCurrentUser, getOrSetGuestCartToken, peekGuestCartToken } from "@/lib/auth";
import { getOrCreateCartForUser, getOrCreateCartForGuest, getCartLines } from "@/lib/db/repo";
import type { CartLine } from "@/lib/db/types";

/** For use inside Server Actions (may create the guest cookie). Returns the active cart id. */
export async function getOrCreateCurrentCartId(): Promise<string> {
  const user = await getCurrentUser();
  if (user) return getOrCreateCartForUser(user.id).id;
  const token = await getOrSetGuestCartToken();
  return getOrCreateCartForGuest(token).id;
}

/** For use during render (Server Components) — never writes a cookie. Returns null if a guest has no cart yet. */
export async function getCurrentCartIdReadOnly(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user) return getOrCreateCartForUser(user.id).id;
  const token = await peekGuestCartToken();
  if (!token) return null;
  return getOrCreateCartForGuest(token).id;
}

export async function getCurrentCartSummary(): Promise<{ cartId: string | null; lines: CartLine[]; itemCount: number; subtotalCents: number }> {
  const cartId = await getCurrentCartIdReadOnly();
  if (!cartId) return { cartId: null, lines: [], itemCount: 0, subtotalCents: 0 };
  const lines = getCartLines(cartId);
  return {
    cartId,
    lines,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents: lines.reduce((n, l) => n + l.lineTotalCents, 0),
  };
}
