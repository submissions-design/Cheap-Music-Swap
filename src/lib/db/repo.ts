import { randomUUID } from "node:crypto";
import { getDb } from "./client";
import type {
  User,
  Address,
  PaymentMethod,
  Product,
  Cart,
  CartLine,
  Order,
  OrderItem,
  MessageThread,
  MessageRow,
  TaxRate,
  ShippingOption,
} from "./types";

const PAGE_SIZE = 12;

// ---------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------

export function createUser(input: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  verificationToken: string;
}): User {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_verified, verification_token, verification_sent_at)
     VALUES (?, ?, ?, ?, ?, ?, 'customer', 0, ?, datetime('now'))`
  ).run(id, input.email.toLowerCase().trim(), input.passwordHash, input.firstName, input.lastName, input.phone ?? null, input.verificationToken);
  return getUserById(id)!;
}

export function getUserByEmail(email: string): User | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase().trim()) as User | undefined;
}

export function getUserById(id: string): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function verifyUserByToken(token: string): User | undefined {
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE verification_token = ?").get(token) as User | undefined;
  if (!user) return undefined;
  db.prepare("UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?").run(user.id);
  return getUserById(user.id);
}

export function updateUserProfile(
  userId: string,
  input: { firstName: string; lastName: string; phone: string | null }
) {
  getDb()
    .prepare("UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?")
    .run(input.firstName, input.lastName, input.phone, userId);
}

// ---------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------

export function listAddressesByUser(userId: string): Address[] {
  return getDb()
    .prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as unknown as Address[];
}

export function getAddressById(id: string): Address | undefined {
  return getDb().prepare("SELECT * FROM addresses WHERE id = ?").get(id) as Address | undefined;
}

export function createAddress(input: Omit<Address, "id" | "created_at">): Address {
  const db = getDb();
  const id = randomUUID();
  if (input.is_default_shipping) {
    db.prepare("UPDATE addresses SET is_default_shipping = 0 WHERE user_id = ?").run(input.user_id);
  }
  if (input.is_default_billing) {
    db.prepare("UPDATE addresses SET is_default_billing = 0 WHERE user_id = ?").run(input.user_id);
  }
  db.prepare(
    `INSERT INTO addresses (id, user_id, label, full_name, line1, line2, city, state, postal_code, country, phone, is_default_shipping, is_default_billing)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.user_id,
    input.label,
    input.full_name,
    input.line1,
    input.line2,
    input.city,
    input.state,
    input.postal_code,
    input.country,
    input.phone,
    input.is_default_shipping,
    input.is_default_billing
  );
  return getAddressById(id)!;
}

export function deleteAddress(id: string, userId: string) {
  getDb().prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?").run(id, userId);
}

// ---------------------------------------------------------------------
// Payment methods (stored references only — see types.ts note)
// ---------------------------------------------------------------------

export function listPaymentMethods(userId: string): PaymentMethod[] {
  return getDb()
    .prepare("SELECT * FROM payment_methods WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as unknown as PaymentMethod[];
}

export function addPaymentMethod(input: Omit<PaymentMethod, "id" | "created_at">): PaymentMethod {
  const db = getDb();
  const id = randomUUID();
  if (input.is_default) {
    db.prepare("UPDATE payment_methods SET is_default = 0 WHERE user_id = ?").run(input.user_id);
  }
  db.prepare(
    `INSERT INTO payment_methods (id, user_id, label, card_brand, last4, exp_month, exp_year, billing_address_id, processor, processor_token, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.user_id,
    input.label,
    input.card_brand,
    input.last4,
    input.exp_month,
    input.exp_year,
    input.billing_address_id,
    input.processor,
    input.processor_token,
    input.is_default
  );
  return db.prepare("SELECT * FROM payment_methods WHERE id = ?").get(id) as unknown as PaymentMethod;
}

export function deletePaymentMethod(id: string, userId: string) {
  getDb().prepare("DELETE FROM payment_methods WHERE id = ? AND user_id = ?").run(id, userId);
}

// ---------------------------------------------------------------------
// Products / catalog
// ---------------------------------------------------------------------

export interface ProductFilter {
  q?: string;
  format?: string;
  genre?: string;
  artist?: string;
  category?: "format" | "genre" | "artist" | "accessories" | "other";
  page?: number;
}

export function listProducts(filter: ProductFilter): { items: Product[]; total: number; page: number; pageSize: number } {
  const db = getDb();
  const where: string[] = ["status = 'active'"];
  const params: (string | number)[] = [];

  if (filter.q) {
    where.push("(title LIKE ? OR artist LIKE ? OR genre LIKE ? OR description LIKE ?)");
    const like = `%${filter.q}%`;
    params.push(like, like, like, like);
  }
  if (filter.format) {
    where.push("format = ?");
    params.push(filter.format);
  }
  if (filter.genre) {
    where.push("genre = ?");
    params.push(filter.genre);
  }
  if (filter.artist) {
    where.push("artist = ?");
    params.push(filter.artist);
  }
  if (filter.category === "accessories") {
    where.push("format = 'Accessory'");
  }
  if (filter.category === "other") {
    where.push("format = 'Other'");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (db.prepare(`SELECT COUNT(*) as c FROM products ${whereSql}`).get(...params) as { c: number }).c;

  const page = Math.max(1, filter.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;
  const items = db
    .prepare(`SELECT * FROM products ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, PAGE_SIZE, offset) as unknown as Product[];

  return { items, total, page, pageSize: PAGE_SIZE };
}

export function listRecentProducts(limit = 8): Product[] {
  return getDb()
    .prepare("SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC LIMIT ?")
    .all(limit) as unknown as Product[];
}

export function getProductById(id: string): Product | undefined {
  return getDb().prepare("SELECT * FROM products WHERE id = ?").get(id) as Product | undefined;
}

export function countByFormat(): { format: string; count: number }[] {
  return getDb()
    .prepare("SELECT format, COUNT(*) as count FROM products WHERE status = 'active' GROUP BY format ORDER BY format")
    .all() as { format: string; count: number }[];
}

export function countByGenre(limit = 12): { genre: string; count: number }[] {
  return getDb()
    .prepare(
      `SELECT genre, COUNT(*) as count FROM products
       WHERE status = 'active' AND genre IS NOT NULL AND format NOT IN ('Accessory','Other')
       GROUP BY genre ORDER BY count DESC, genre ASC LIMIT ?`
    )
    .all(limit) as { genre: string; count: number }[];
}

export function countByArtist(limit = 12): { artist: string; count: number }[] {
  return getDb()
    .prepare(
      `SELECT artist, COUNT(*) as count FROM products
       WHERE status = 'active' AND artist IS NOT NULL AND format NOT IN ('Accessory','Other','Turntable')
       GROUP BY artist ORDER BY count DESC, artist ASC LIMIT ?`
    )
    .all(limit) as { artist: string; count: number }[];
}

export function listDistinctFormats(): string[] {
  return (getDb().prepare("SELECT DISTINCT format FROM products WHERE status='active' ORDER BY format").all() as { format: string }[]).map(
    (r) => r.format
  );
}

export function listDistinctGenres(): string[] {
  return (
    getDb()
      .prepare("SELECT DISTINCT genre FROM products WHERE status='active' AND genre IS NOT NULL ORDER BY genre")
      .all() as { genre: string }[]
  ).map((r) => r.genre);
}

export function listDistinctArtists(): string[] {
  return (
    getDb()
      .prepare("SELECT DISTINCT artist FROM products WHERE status='active' AND artist IS NOT NULL ORDER BY artist")
      .all() as { artist: string }[]
  ).map((r) => r.artist);
}

export function createSellerListing(input: {
  sellerUserId: string;
  title: string;
  artist: string | null;
  format: string;
  genre: string | null;
  condition: string;
  priceCents: number;
  quantity: number;
  description: string;
  imageUrl: string | null;
}): Product {
  const db = getDb();
  const id = randomUUID();
  const sku = `SELL-${Date.now().toString(36).toUpperCase()}`;
  db.prepare(
    `INSERT INTO products (id, sku, title, artist, format, genre, condition, price_cents, quantity, description, image_url, is_seller_listing, seller_user_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'pending_approval')`
  ).run(
    id,
    sku,
    input.title,
    input.artist,
    input.format,
    input.genre,
    input.condition,
    input.priceCents,
    input.quantity,
    input.description,
    input.imageUrl,
    input.sellerUserId
  );
  return getProductById(id)!;
}

export function listListingsBySeller(userId: string): Product[] {
  return getDb()
    .prepare("SELECT * FROM products WHERE seller_user_id = ? ORDER BY created_at DESC")
    .all(userId) as unknown as Product[];
}

export function listPendingListings(): Product[] {
  return getDb()
    .prepare("SELECT * FROM products WHERE status = 'pending_approval' ORDER BY created_at ASC")
    .all() as unknown as Product[];
}

export function setListingStatus(id: string, status: "active" | "rejected", adminNote?: string) {
  getDb().prepare("UPDATE products SET status = ?, admin_note = ? WHERE id = ?").run(status, adminNote ?? null, id);
}

// ---------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------

export function getOrCreateCartForUser(userId: string): Cart {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM carts WHERE user_id = ?").get(userId) as unknown as Cart | undefined;
  if (existing) return existing;
  const id = randomUUID();
  db.prepare("INSERT INTO carts (id, user_id) VALUES (?, ?)").run(id, userId);
  return db.prepare("SELECT * FROM carts WHERE id = ?").get(id) as unknown as Cart;
}

export function getOrCreateCartForGuest(guestToken: string): Cart {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM carts WHERE guest_token = ?").get(guestToken) as unknown as Cart | undefined;
  if (existing) return existing;
  const id = randomUUID();
  db.prepare("INSERT INTO carts (id, guest_token) VALUES (?, ?)").run(id, guestToken);
  return db.prepare("SELECT * FROM carts WHERE id = ?").get(id) as unknown as Cart;
}

export function mergeGuestCartIntoUser(guestToken: string, userId: string) {
  const db = getDb();
  const guestCart = db.prepare("SELECT * FROM carts WHERE guest_token = ?").get(guestToken) as unknown as Cart | undefined;
  if (!guestCart) return;
  const userCart = getOrCreateCartForUser(userId);
  const items = db.prepare("SELECT * FROM cart_items WHERE cart_id = ?").all(guestCart.id) as { product_id: string; quantity: number }[];
  for (const item of items) {
    addItemToCart(userCart.id, item.product_id, item.quantity);
  }
  db.prepare("DELETE FROM carts WHERE id = ?").run(guestCart.id);
}

export function addItemToCart(cartId: string, productId: string, quantity: number) {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?")
    .get(cartId, productId) as { id: string; quantity: number } | undefined;
  if (existing) {
    db.prepare("UPDATE cart_items SET quantity = quantity + ? WHERE id = ?").run(quantity, existing.id);
  } else {
    db.prepare("INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?, ?, ?, ?)").run(
      randomUUID(),
      cartId,
      productId,
      quantity
    );
  }
  db.prepare("UPDATE carts SET updated_at = datetime('now') WHERE id = ?").run(cartId);
}

export function updateCartItemQuantity(cartId: string, productId: string, quantity: number) {
  const db = getDb();
  if (quantity <= 0) {
    db.prepare("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?").run(cartId, productId);
  } else {
    db.prepare("UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?").run(quantity, cartId, productId);
  }
}

export function removeCartItem(cartId: string, productId: string) {
  getDb().prepare("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?").run(cartId, productId);
}

export function clearCart(cartId: string) {
  getDb().prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cartId);
}

export function getCartLines(cartId: string): CartLine[] {
  const rows = getDb()
    .prepare(
      `SELECT ci.product_id as productId, ci.quantity as quantity,
              p.title as title, p.artist as artist, p.format as format,
              p.image_url as imageUrl, p.price_cents as unitPriceCents, p.quantity as available
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = ?`
    )
    .all(cartId) as Omit<CartLine, "lineTotalCents">[];
  return rows.map((r) => ({ ...r, lineTotalCents: r.unitPriceCents * r.quantity }));
}

// ---------------------------------------------------------------------
// Tax & shipping
// ---------------------------------------------------------------------

export function getTaxRateForState(stateCode: string): TaxRate | undefined {
  return getDb().prepare("SELECT * FROM tax_rates WHERE state_code = ?").get(stateCode.toUpperCase()) as
    | TaxRate
    | undefined;
}

export function listShippingOptions(): ShippingOption[] {
  return getDb()
    .prepare("SELECT * FROM shipping_options WHERE is_active = 1 ORDER BY sort_order")
    .all() as unknown as ShippingOption[];
}

export function getShippingOptionById(id: string): ShippingOption | undefined {
  return getDb().prepare("SELECT * FROM shipping_options WHERE id = ?").get(id) as ShippingOption | undefined;
}

// ---------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------

export function generateOrderNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CMS-${Date.now().toString(36).toUpperCase()}${rand}`;
}

export function createOrder(input: {
  userId: string | null;
  guestEmail: string | null;
  lines: CartLine[];
  taxCents: number;
  shippingCents: number;
  shippingAddress: {
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingOptionName: string;
  paymentProcessor: string;
  paymentReference: string;
}): Order {
  const db = getDb();
  const subtotal = input.lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const total = subtotal + input.taxCents + input.shippingCents;
  const id = randomUUID();
  const orderNumber = generateOrderNumber();

  db.prepare(
    `INSERT INTO orders (id, order_number, user_id, guest_email, status, subtotal_cents, tax_cents, shipping_cents, total_cents,
       shipping_name, shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
       shipping_option_name, payment_processor, payment_reference)
     VALUES (?, ?, ?, ?, 'paid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    orderNumber,
    input.userId,
    input.guestEmail,
    subtotal,
    input.taxCents,
    input.shippingCents,
    total,
    input.shippingAddress.name,
    input.shippingAddress.line1,
    input.shippingAddress.line2,
    input.shippingAddress.city,
    input.shippingAddress.state,
    input.shippingAddress.postalCode,
    input.shippingAddress.country,
    input.shippingOptionName,
    input.paymentProcessor,
    input.paymentReference
  );

  const insertItem = db.prepare(
    `INSERT INTO order_items (id, order_id, product_id, title_snapshot, artist_snapshot, format_snapshot, unit_price_cents, quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const decrementStock = db.prepare("UPDATE products SET quantity = MAX(0, quantity - ?) WHERE id = ?");
  for (const line of input.lines) {
    insertItem.run(randomUUID(), id, line.productId, line.title, line.artist, line.format, line.unitPriceCents, line.quantity);
    decrementStock.run(line.quantity, line.productId);
  }

  return getOrderById(id)!;
}

export function getOrderById(id: string): Order | undefined {
  return getDb().prepare("SELECT * FROM orders WHERE id = ?").get(id) as unknown as Order | undefined;
}

export function getOrderByNumber(orderNumber: string): Order | undefined {
  return getDb().prepare("SELECT * FROM orders WHERE order_number = ?").get(orderNumber) as unknown as Order | undefined;
}

export function getOrderItems(orderId: string): OrderItem[] {
  return getDb().prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId) as unknown as OrderItem[];
}

export function listOrdersByUser(userId: string): Order[] {
  return getDb().prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY placed_at DESC").all(userId) as unknown as Order[];
}

export function listAllOrders(): Order[] {
  return getDb().prepare("SELECT * FROM orders ORDER BY placed_at DESC").all() as unknown as Order[];
}

export function cancelOrder(orderId: string, userId: string): { ok: boolean; reason?: string } {
  const order = getOrderById(orderId);
  if (!order || order.user_id !== userId) return { ok: false, reason: "Order not found." };
  if (order.status === "shipped") return { ok: false, reason: "This order has already shipped and can't be cancelled." };
  if (order.status === "cancelled") return { ok: false, reason: "This order is already cancelled." };
  getDb().prepare("UPDATE orders SET status = 'cancelled', cancelled_at = datetime('now') WHERE id = ?").run(orderId);
  return { ok: true };
}

export function markOrderShipped(orderId: string) {
  getDb().prepare("UPDATE orders SET status = 'shipped', shipped_at = datetime('now') WHERE id = ?").run(orderId);
}

// ---------------------------------------------------------------------
// Messages (customer <-> admin)
// ---------------------------------------------------------------------

export function createMessageThread(input: {
  userId: string | null;
  guestEmail: string | null;
  guestName: string | null;
  subject: string;
  body: string;
}): MessageThread {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO message_threads (id, user_id, guest_email, guest_name, subject) VALUES (?, ?, ?, ?, ?)`
  ).run(id, input.userId, input.guestEmail, input.guestName, input.subject);
  db.prepare("INSERT INTO messages (id, thread_id, sender, body) VALUES (?, ?, 'customer', ?)").run(
    randomUUID(),
    id,
    input.body
  );
  return db.prepare("SELECT * FROM message_threads WHERE id = ?").get(id) as unknown as MessageThread;
}

export function addMessageToThread(threadId: string, sender: "customer" | "admin", body: string) {
  const db = getDb();
  db.prepare("INSERT INTO messages (id, thread_id, sender, body) VALUES (?, ?, ?, ?)").run(randomUUID(), threadId, sender, body);
  db.prepare("UPDATE message_threads SET updated_at = datetime('now') WHERE id = ?").run(threadId);
}

export function listThreadsByUser(userId: string): MessageThread[] {
  return getDb()
    .prepare("SELECT * FROM message_threads WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId) as unknown as MessageThread[];
}

export function listAllThreads(): MessageThread[] {
  return getDb().prepare("SELECT * FROM message_threads ORDER BY updated_at DESC").all() as unknown as MessageThread[];
}

export function getThreadById(id: string): MessageThread | undefined {
  return getDb().prepare("SELECT * FROM message_threads WHERE id = ?").get(id) as unknown as MessageThread | undefined;
}

export function getMessagesForThread(threadId: string): MessageRow[] {
  return getDb().prepare("SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC").all(threadId) as unknown as MessageRow[];
}
