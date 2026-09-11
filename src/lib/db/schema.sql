-- Cheap Music Swap database schema (SQLite via Node's built-in node:sqlite).
-- Portable: the same statements run on Postgres/MySQL with minor type tweaks
-- if this is later migrated off SQLite for production (see README).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer', -- 'customer' | 'admin'
  is_verified INTEGER NOT NULL DEFAULT 0,
  verification_token TEXT,
  verification_sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  full_name TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  phone TEXT,
  is_default_shipping INTEGER NOT NULL DEFAULT 0,
  is_default_billing INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Stored "payment methods" are non-sensitive references only (brand/last4/
-- expiry + an opaque processor token). Full card data must never touch this
-- database — see lib/payments/README in the app for the real-processor flow.
CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  card_brand TEXT NOT NULL,
  last4 TEXT NOT NULL,
  exp_month INTEGER NOT NULL,
  exp_year INTEGER NOT NULL,
  billing_address_id TEXT REFERENCES addresses(id) ON DELETE SET NULL,
  processor TEXT NOT NULL DEFAULT 'mock',
  processor_token TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Admin-managed taxonomy. Products still store format/genre/artist as plain
-- text (kept for simplicity — see repo.ts), but the browsable lists shown
-- in the header/sidebar and the dropdowns offered when creating a product
-- come from these tables, so an admin can add a brand-new heading (e.g.
-- "Clothing Gear") before any product uses it, and it will still appear
-- with a count of 0.
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS genres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Shipping carriers used to build tracking links in shipment emails.
-- {tracking} in the template is replaced with the order's tracking number.
CREATE TABLE IF NOT EXISTS carriers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tracking_url_template TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist TEXT,
  format TEXT NOT NULL, -- category name, admin-managed via the categories table
  genre TEXT,
  condition TEXT NOT NULL DEFAULT 'New', -- 'New' | 'Used - Like New' | 'Used - Good' | 'Used - Fair'
  price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  is_seller_listing INTEGER NOT NULL DEFAULT 0,
  seller_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'pending_approval' | 'rejected' | 'inactive'
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_format ON products(format);
CREATE INDEX IF NOT EXISTS idx_products_genre ON products(genre);
CREATE INDEX IF NOT EXISTS idx_products_artist ON products(artist);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  guest_token TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_guest ON carts(guest_token) WHERE guest_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS tax_rates (
  id TEXT PRIMARY KEY,
  state_code TEXT NOT NULL UNIQUE,
  rate_percent REAL NOT NULL,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shipping_options (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  flat_rate_cents INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  guest_email TEXT,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing' | 'paid' | 'shipped' | 'cancelled' | 'refunded'
  subtotal_cents INTEGER NOT NULL,
  tax_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  shipping_name TEXT NOT NULL,
  shipping_line1 TEXT NOT NULL,
  shipping_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'US',
  shipping_option_name TEXT NOT NULL,
  payment_processor TEXT NOT NULL,
  payment_reference TEXT,
  carrier_id TEXT REFERENCES carriers(id) ON DELETE SET NULL,
  tracking_number TEXT,
  placed_at TEXT NOT NULL DEFAULT (datetime('now')),
  shipped_at TEXT,
  cancelled_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  title_snapshot TEXT NOT NULL,
  artist_snapshot TEXT,
  format_snapshot TEXT,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS message_threads (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  guest_email TEXT,
  guest_name TEXT,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'closed'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'customer' | 'admin'
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------
-- Blog
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  cover_image_url TEXT,
  author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blog_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible', -- 'visible' | 'hidden'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
