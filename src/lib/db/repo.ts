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
  Category,
  Genre,
  Artist,
  Carrier,
  BlogPost,
  BlogComment,
  SiteSettings,
} from "./types";

const PAGE_SIZE = 12;

// ---------------------------------------------------------------------
// Site-wide appearance settings (admin-managed)
// ---------------------------------------------------------------------

export function getSiteSettings(): SiteSettings {
  const row = getDb().prepare("SELECT * FROM site_settings WHERE id = 'default'").get() as
    | SiteSettings
    | undefined;
  if (row) return row;
  // Defensive fallback for a database that predates this table and hasn't
  // gone through getDb()'s seed step yet (shouldn't normally happen).
  getDb().prepare("INSERT OR IGNORE INTO site_settings (id, header_bg_image_url) VALUES ('default', NULL)").run();
  return getDb().prepare("SELECT * FROM site_settings WHERE id = 'default'").get() as unknown as SiteSettings;
}

export function setHeaderBackgroundImage(url: string | null) {
  getDb()
    .prepare("UPDATE site_settings SET header_bg_image_url = ?, updated_at = datetime('now') WHERE id = 'default'")
    .run(url);
}

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

// Category/genre/artist counts are driven from the admin-managed tables
// (LEFT JOINed to products) rather than DISTINCT-ing products directly, so
// a heading an admin just added shows up immediately with a count of 0
// instead of waiting for a product to use it.

export function countByFormat(): { format: string; count: number }[] {
  return getDb()
    .prepare(
      `SELECT c.name as format, COUNT(p.id) as count
       FROM categories c
       LEFT JOIN products p ON p.format = c.name AND p.status = 'active'
       WHERE c.is_active = 1
       GROUP BY c.name
       ORDER BY c.sort_order, c.name`
    )
    .all() as { format: string; count: number }[];
}

export function countByGenre(limit = 20): { genre: string; count: number }[] {
  return getDb()
    .prepare(
      `SELECT g.name as genre, COUNT(p.id) as count
       FROM genres g
       LEFT JOIN products p ON p.genre = g.name AND p.status = 'active' AND p.format NOT IN ('Accessory','Other')
       WHERE g.is_active = 1
       GROUP BY g.name
       ORDER BY g.sort_order, count DESC, g.name ASC
       LIMIT ?`
    )
    .all(limit) as { genre: string; count: number }[];
}

export function countByArtist(limit = 20): { artist: string; count: number }[] {
  return getDb()
    .prepare(
      `SELECT a.name as artist, COUNT(p.id) as count
       FROM artists a
       LEFT JOIN products p ON p.artist = a.name AND p.status = 'active' AND p.format NOT IN ('Accessory','Other','Turntable')
       GROUP BY a.name
       ORDER BY count DESC, a.name ASC
       LIMIT ?`
    )
    .all(limit) as { artist: string; count: number }[];
}

export function listDistinctFormats(): string[] {
  return listCategories(true).map((c) => c.name);
}

export function listDistinctGenres(): string[] {
  return listGenres(true).map((g) => g.name);
}

export function listDistinctArtists(): string[] {
  return listArtists().map((a) => a.name);
}

// ---------------------------------------------------------------------
// Categories (Format headings) — admin-managed
// ---------------------------------------------------------------------

export function listCategories(activeOnly = false): Category[] {
  const where = activeOnly ? "WHERE is_active = 1" : "";
  return getDb().prepare(`SELECT * FROM categories ${where} ORDER BY sort_order, name`).all() as unknown as Category[];
}

export function createCategory(name: string): Category {
  const db = getDb();
  const id = randomUUID();
  const maxOrder = (db.prepare("SELECT COALESCE(MAX(sort_order), -1) as m FROM categories").get() as { m: number }).m;
  db.prepare("INSERT INTO categories (id, name, is_active, sort_order) VALUES (?, ?, 1, ?)").run(id, name.trim(), maxOrder + 1);
  return db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as unknown as Category;
}

export function updateCategory(id: string, input: { name?: string; is_active?: number; sort_order?: number }) {
  const db = getDb();
  const current = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as unknown as Category | undefined;
  if (!current) return;
  db.prepare("UPDATE categories SET name = ?, is_active = ?, sort_order = ? WHERE id = ?").run(
    input.name?.trim() ?? current.name,
    input.is_active ?? current.is_active,
    input.sort_order ?? current.sort_order,
    id
  );
}

export function deleteCategory(id: string) {
  getDb().prepare("DELETE FROM categories WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------
// Genres — admin-managed
// ---------------------------------------------------------------------

export function listGenres(activeOnly = false): Genre[] {
  const where = activeOnly ? "WHERE is_active = 1" : "";
  return getDb().prepare(`SELECT * FROM genres ${where} ORDER BY sort_order, name`).all() as unknown as Genre[];
}

export function createGenre(name: string): Genre {
  const db = getDb();
  const id = randomUUID();
  const maxOrder = (db.prepare("SELECT COALESCE(MAX(sort_order), -1) as m FROM genres").get() as { m: number }).m;
  db.prepare("INSERT INTO genres (id, name, is_active, sort_order) VALUES (?, ?, 1, ?)").run(id, name.trim(), maxOrder + 1);
  return db.prepare("SELECT * FROM genres WHERE id = ?").get(id) as unknown as Genre;
}

export function updateGenre(id: string, input: { name?: string; is_active?: number; sort_order?: number }) {
  const db = getDb();
  const current = db.prepare("SELECT * FROM genres WHERE id = ?").get(id) as unknown as Genre | undefined;
  if (!current) return;
  db.prepare("UPDATE genres SET name = ?, is_active = ?, sort_order = ? WHERE id = ?").run(
    input.name?.trim() ?? current.name,
    input.is_active ?? current.is_active,
    input.sort_order ?? current.sort_order,
    id
  );
}

export function deleteGenre(id: string) {
  getDb().prepare("DELETE FROM genres WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------
// Artists — admin-managed (also grows automatically as sellers/admins add
// products under a new artist name — see upsertArtist)
// ---------------------------------------------------------------------

export function listArtists(): Artist[] {
  return getDb().prepare("SELECT * FROM artists ORDER BY name").all() as unknown as Artist[];
}

export function createArtist(name: string): Artist {
  const db = getDb();
  const id = randomUUID();
  db.prepare("INSERT OR IGNORE INTO artists (id, name) VALUES (?, ?)").run(id, name.trim());
  return db.prepare("SELECT * FROM artists WHERE name = ?").get(name.trim()) as unknown as Artist;
}

/** Ensures an artist row exists for this name (no-op if it already does). Used when a product names a new artist. */
export function upsertArtist(name: string | null) {
  if (!name || !name.trim()) return;
  getDb().prepare("INSERT OR IGNORE INTO artists (id, name) VALUES (?, ?)").run(randomUUID(), name.trim());
}

export function deleteArtist(id: string) {
  getDb().prepare("DELETE FROM artists WHERE id = ?").run(id);
}

/**
 * How many products (any status) currently reference each taxonomy value.
 * Used on the admin Categories & Genres page so admin can see the impact
 * of renaming or deleting a heading before doing it (products keep their
 * existing text value either way — see schema.sql note on why these stay
 * plain-text columns rather than foreign keys).
 */
export function productCountsByFormat(): Record<string, number> {
  const rows = getDb().prepare("SELECT format, COUNT(*) as c FROM products GROUP BY format").all() as {
    format: string;
    c: number;
  }[];
  return Object.fromEntries(rows.map((r) => [r.format, r.c]));
}

export function productCountsByGenre(): Record<string, number> {
  const rows = getDb()
    .prepare("SELECT genre, COUNT(*) as c FROM products WHERE genre IS NOT NULL GROUP BY genre")
    .all() as { genre: string; c: number }[];
  return Object.fromEntries(rows.map((r) => [r.genre, r.c]));
}

export function productCountsByArtist(): Record<string, number> {
  const rows = getDb()
    .prepare("SELECT artist, COUNT(*) as c FROM products WHERE artist IS NOT NULL GROUP BY artist")
    .all() as { artist: string; c: number }[];
  return Object.fromEntries(rows.map((r) => [r.artist, r.c]));
}

// ---------------------------------------------------------------------
// Shipping carriers — admin-managed
// ---------------------------------------------------------------------

export function listCarriers(activeOnly = false): Carrier[] {
  const where = activeOnly ? "WHERE is_active = 1" : "";
  return getDb().prepare(`SELECT * FROM carriers ${where} ORDER BY sort_order, name`).all() as unknown as Carrier[];
}

export function getCarrierById(id: string): Carrier | undefined {
  return getDb().prepare("SELECT * FROM carriers WHERE id = ?").get(id) as unknown as Carrier | undefined;
}

export function createCarrier(input: { name: string; tracking_url_template: string | null }): Carrier {
  const db = getDb();
  const id = randomUUID();
  const maxOrder = (db.prepare("SELECT COALESCE(MAX(sort_order), -1) as m FROM carriers").get() as { m: number }).m;
  db.prepare("INSERT INTO carriers (id, name, tracking_url_template, is_active, sort_order) VALUES (?, ?, ?, 1, ?)").run(
    id,
    input.name.trim(),
    input.tracking_url_template || null,
    maxOrder + 1
  );
  return db.prepare("SELECT * FROM carriers WHERE id = ?").get(id) as unknown as Carrier;
}

export function updateCarrier(id: string, input: { name?: string; tracking_url_template?: string | null; is_active?: number }) {
  const db = getDb();
  const current = db.prepare("SELECT * FROM carriers WHERE id = ?").get(id) as unknown as Carrier | undefined;
  if (!current) return;
  db.prepare("UPDATE carriers SET name = ?, tracking_url_template = ?, is_active = ? WHERE id = ?").run(
    input.name?.trim() ?? current.name,
    input.tracking_url_template !== undefined ? input.tracking_url_template : current.tracking_url_template,
    input.is_active ?? current.is_active,
    id
  );
}

export function deleteCarrier(id: string) {
  getDb().prepare("DELETE FROM carriers WHERE id = ?").run(id);
}

export function buildTrackingUrl(carrier: Carrier | undefined, trackingNumber: string | null): string | null {
  if (!carrier?.tracking_url_template || !trackingNumber) return null;
  return carrier.tracking_url_template.replace("{tracking}", encodeURIComponent(trackingNumber));
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
  upsertArtist(input.artist);
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

export function setListingStatus(id: string, status: "active" | "rejected" | "inactive", adminNote?: string) {
  getDb().prepare("UPDATE products SET status = ?, admin_note = ? WHERE id = ?").run(status, adminNote ?? null, id);
}

// ---------------------------------------------------------------------
// Admin: inventory management (list/search all products, create/edit,
// adjust stock, swap the cover image)
// ---------------------------------------------------------------------

export interface AdminProductFilter {
  q?: string;
  status?: string; // 'active' | 'pending_approval' | 'rejected' | 'inactive' | 'all'
  page?: number;
}

export function listProductsForAdmin(filter: AdminProductFilter): { items: Product[]; total: number; page: number; pageSize: number } {
  const db = getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (filter.q) {
    where.push("(title LIKE ? OR artist LIKE ? OR sku LIKE ?)");
    const like = `%${filter.q}%`;
    params.push(like, like, like);
  }
  if (filter.status && filter.status !== "all") {
    where.push("status = ?");
    params.push(filter.status);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (db.prepare(`SELECT COUNT(*) as c FROM products ${whereSql}`).get(...params) as { c: number }).c;

  const page = Math.max(1, filter.page ?? 1);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;
  const items = db
    .prepare(`SELECT * FROM products ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset) as unknown as Product[];

  return { items, total, page, pageSize };
}

export function createProductAdmin(input: {
  title: string;
  artist: string | null;
  format: string;
  genre: string | null;
  condition: string;
  priceCents: number;
  quantity: number;
  description: string | null;
  imageUrl: string | null;
}): Product {
  const db = getDb();
  const id = randomUUID();
  const sku = `ADM-${Date.now().toString(36).toUpperCase()}`;
  db.prepare(
    `INSERT INTO products (id, sku, title, artist, format, genre, condition, price_cents, quantity, description, image_url, is_seller_listing, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'active')`
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
    input.imageUrl
  );
  upsertArtist(input.artist);
  return getProductById(id)!;
}

export function updateProduct(
  id: string,
  input: {
    title: string;
    artist: string | null;
    format: string;
    genre: string | null;
    condition: string;
    priceCents: number;
    quantity: number;
    description: string | null;
    imageUrl?: string | null; // omit to leave the current image unchanged
    status: string;
  }
) {
  const db = getDb();
  const current = getProductById(id);
  if (!current) return;
  db.prepare(
    `UPDATE products SET title = ?, artist = ?, format = ?, genre = ?, condition = ?, price_cents = ?, quantity = ?, description = ?, image_url = ?, status = ?
     WHERE id = ?`
  ).run(
    input.title,
    input.artist,
    input.format,
    input.genre,
    input.condition,
    input.priceCents,
    input.quantity,
    input.description,
    input.imageUrl !== undefined ? input.imageUrl : current.image_url,
    input.status,
    id
  );
  upsertArtist(input.artist);
}

export function setProductQuantity(id: string, quantity: number) {
  getDb().prepare("UPDATE products SET quantity = ? WHERE id = ?").run(Math.max(0, quantity), id);
}

export function deleteProductAdmin(id: string) {
  getDb().prepare("DELETE FROM products WHERE id = ?").run(id);
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
// Admin: cart settings (tax rates, shipping options, carriers all live
// here — this is the backing data for the "Cart Settings" dashboard page)
// ---------------------------------------------------------------------

export function listAllTaxRates(): TaxRate[] {
  return getDb().prepare("SELECT * FROM tax_rates ORDER BY state_code").all() as unknown as TaxRate[];
}

export function createTaxRate(input: { stateCode: string; ratePercent: number; label: string }): TaxRate {
  const db = getDb();
  const id = randomUUID();
  db.prepare("INSERT INTO tax_rates (id, state_code, rate_percent, label) VALUES (?, ?, ?, ?)").run(
    id,
    input.stateCode.toUpperCase(),
    input.ratePercent,
    input.label
  );
  return db.prepare("SELECT * FROM tax_rates WHERE id = ?").get(id) as unknown as TaxRate;
}

export function updateTaxRate(id: string, input: { stateCode: string; ratePercent: number; label: string }) {
  getDb()
    .prepare("UPDATE tax_rates SET state_code = ?, rate_percent = ?, label = ? WHERE id = ?")
    .run(input.stateCode.toUpperCase(), input.ratePercent, input.label, id);
}

export function deleteTaxRate(id: string) {
  getDb().prepare("DELETE FROM tax_rates WHERE id = ?").run(id);
}

export function listAllShippingOptions(): ShippingOption[] {
  return getDb().prepare("SELECT * FROM shipping_options ORDER BY sort_order").all() as unknown as ShippingOption[];
}

export function createShippingOption(input: {
  name: string;
  description: string | null;
  flatRateCents: number;
  isActive: boolean;
  sortOrder: number;
}): ShippingOption {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    "INSERT INTO shipping_options (id, name, description, flat_rate_cents, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, input.name, input.description, input.flatRateCents, input.isActive ? 1 : 0, input.sortOrder);
  return db.prepare("SELECT * FROM shipping_options WHERE id = ?").get(id) as unknown as ShippingOption;
}

export function updateShippingOption(
  id: string,
  input: { name: string; description: string | null; flatRateCents: number; isActive: boolean; sortOrder: number }
) {
  getDb()
    .prepare(
      "UPDATE shipping_options SET name = ?, description = ?, flat_rate_cents = ?, is_active = ?, sort_order = ? WHERE id = ?"
    )
    .run(input.name, input.description, input.flatRateCents, input.isActive ? 1 : 0, input.sortOrder, id);
}

export function deleteShippingOption(id: string) {
  getDb().prepare("DELETE FROM shipping_options WHERE id = ?").run(id);
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
// Admin: order management
// ---------------------------------------------------------------------

export interface AdminOrderFilter {
  view?: "all" | "open"; // 'open' = not shipped/cancelled/refunded
  q?: string; // matches order_number, shipping_name, guest_email
}

export function listOrdersForAdmin(filter: AdminOrderFilter = {}): Order[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filter.view === "open") {
    clauses.push("status IN ('processing', 'paid')");
  }
  if (filter.q && filter.q.trim()) {
    clauses.push("(order_number LIKE ? OR shipping_name LIKE ? OR guest_email LIKE ?)");
    const like = `%${filter.q.trim()}%`;
    params.push(like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return getDb()
    .prepare(`SELECT * FROM orders ${where} ORDER BY placed_at DESC`)
    .all(...params) as unknown as Order[];
}

/**
 * Sets (or clears) the carrier + tracking number on an order and marks it
 * shipped. Does not send email itself — callers (Server Actions) own that,
 * so this stays a pure data operation like the rest of repo.ts.
 */
export function setOrderShipment(orderId: string, carrierId: string | null, trackingNumber: string | null) {
  getDb()
    .prepare(
      `UPDATE orders
       SET carrier_id = ?, tracking_number = ?, status = 'shipped', shipped_at = datetime('now')
       WHERE id = ?`
    )
    .run(carrierId, trackingNumber, orderId);
  return getOrderById(orderId)!;
}

export function setOrderStatus(orderId: string, status: string) {
  getDb().prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
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

export function listThreadsForOrder(orderId: string): MessageThread[] {
  return getDb()
    .prepare("SELECT * FROM message_threads WHERE order_id = ? ORDER BY updated_at DESC")
    .all(orderId) as unknown as MessageThread[];
}

/**
 * Used by the admin order-management screen: "send communication to a
 * particular customer about their order." Reuses an existing open thread
 * for the order if one exists, otherwise opens a new admin-initiated one.
 */
export function startOrContinueOrderThread(input: {
  orderId: string;
  userId: string | null;
  guestEmail: string | null;
  guestName: string | null;
  subject: string;
  body: string;
}): MessageThread {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM message_threads WHERE order_id = ? AND status = 'open' ORDER BY updated_at DESC LIMIT 1")
    .get(input.orderId) as unknown as MessageThread | undefined;

  if (existing) {
    addMessageToThread(existing.id, "admin", input.body);
    return getThreadById(existing.id)!;
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO message_threads (id, user_id, guest_email, guest_name, order_id, subject) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, input.userId, input.guestEmail, input.guestName, input.orderId, input.subject);
  db.prepare("INSERT INTO messages (id, thread_id, sender, body) VALUES (?, ?, 'admin', ?)").run(randomUUID(), id, input.body);
  return db.prepare("SELECT * FROM message_threads WHERE id = ?").get(id) as unknown as MessageThread;
}

// ---------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "post"
  );
}

function uniqueSlug(db: ReturnType<typeof getDb>, base: string, excludeId?: string): string {
  let slug = base;
  let n = 2;
  for (;;) {
    const row = db.prepare("SELECT id FROM blog_posts WHERE slug = ?").get(slug) as { id: string } | undefined;
    if (!row || row.id === excludeId) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

export function listPublishedPosts(): BlogPost[] {
  return getDb()
    .prepare("SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC")
    .all() as unknown as BlogPost[];
}

export function listAllPostsAdmin(): BlogPost[] {
  return getDb().prepare("SELECT * FROM blog_posts ORDER BY created_at DESC").all() as unknown as BlogPost[];
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getDb().prepare("SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'").get(slug) as unknown as
    | BlogPost
    | undefined;
}

export function getPostBySlugAdmin(slug: string): BlogPost | undefined {
  return getDb().prepare("SELECT * FROM blog_posts WHERE slug = ?").get(slug) as unknown as BlogPost | undefined;
}

export function getPostById(id: string): BlogPost | undefined {
  return getDb().prepare("SELECT * FROM blog_posts WHERE id = ?").get(id) as unknown as BlogPost | undefined;
}

export function createPost(input: {
  title: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  authorUserId: string | null;
  status: "draft" | "published";
}): BlogPost {
  const db = getDb();
  const id = randomUUID();
  const slug = uniqueSlug(db, slugify(input.title));
  const publishedAt = input.status === "published" ? new Date().toISOString() : null;
  db.prepare(
    `INSERT INTO blog_posts (id, slug, title, excerpt, body, cover_image_url, author_user_id, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, slug, input.title, input.excerpt, input.body, input.coverImageUrl, input.authorUserId, input.status, publishedAt);
  return getPostById(id)!;
}

export function updatePost(
  id: string,
  input: {
    title: string;
    excerpt: string | null;
    body: string;
    coverImageUrl?: string | null; // omit to leave the current cover image unchanged
    status: "draft" | "published";
  }
) {
  const db = getDb();
  const current = getPostById(id);
  if (!current) return;
  const slug = current.title === input.title ? current.slug : uniqueSlug(db, slugify(input.title), id);
  const publishedAt = current.published_at ?? (input.status === "published" ? new Date().toISOString() : null);
  db.prepare(
    `UPDATE blog_posts
     SET slug = ?, title = ?, excerpt = ?, body = ?, cover_image_url = ?, status = ?, published_at = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    slug,
    input.title,
    input.excerpt,
    input.body,
    input.coverImageUrl !== undefined ? input.coverImageUrl : current.cover_image_url,
    input.status,
    publishedAt,
    id
  );
}

export function deletePost(id: string) {
  getDb().prepare("DELETE FROM blog_posts WHERE id = ?").run(id);
}

export function listCommentsForPost(postId: string, includeHidden = false): BlogComment[] {
  const where = includeHidden ? "post_id = ?" : "post_id = ? AND status = 'visible'";
  return getDb()
    .prepare(`SELECT * FROM blog_comments WHERE ${where} ORDER BY created_at ASC`)
    .all(postId) as unknown as BlogComment[];
}

export interface BlogCommentWithAuthor extends BlogComment {
  author_name: string;
}

export function listCommentsForPostWithAuthor(postId: string, includeHidden = false): BlogCommentWithAuthor[] {
  const where = includeHidden ? "c.post_id = ?" : "c.post_id = ? AND c.status = 'visible'";
  return getDb()
    .prepare(
      `SELECT c.*, u.first_name || ' ' || u.last_name as author_name
       FROM blog_comments c JOIN users u ON u.id = c.user_id
       WHERE ${where}
       ORDER BY c.created_at ASC`
    )
    .all(postId) as unknown as BlogCommentWithAuthor[];
}

export function addComment(input: { postId: string; userId: string; body: string }): BlogComment {
  const db = getDb();
  const id = randomUUID();
  db.prepare("INSERT INTO blog_comments (id, post_id, user_id, body) VALUES (?, ?, ?, ?)").run(
    id,
    input.postId,
    input.userId,
    input.body
  );
  return db.prepare("SELECT * FROM blog_comments WHERE id = ?").get(id) as unknown as BlogComment;
}

export function setCommentStatus(id: string, status: "visible" | "hidden") {
  getDb().prepare("UPDATE blog_comments SET status = ? WHERE id = ?").run(status, id);
}

export function deleteComment(id: string) {
  getDb().prepare("DELETE FROM blog_comments WHERE id = ?").run(id);
}
