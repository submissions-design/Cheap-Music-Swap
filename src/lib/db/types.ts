export type UserRole = "customer" | "admin";

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  is_verified: number;
  verification_token: string | null;
  verification_sent_at: string | null;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default_shipping: number;
  is_default_billing: number;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  label: string;
  card_brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  billing_address_id: string | null;
  processor: string;
  processor_token: string;
  is_default: number;
  created_at: string;
}

export type ProductFormat = "CD" | "Vinyl" | "Cassette" | "Turntable" | "Accessory" | "Other";
export type ProductStatus = "active" | "pending_approval" | "rejected" | "inactive";

export interface Product {
  id: string;
  sku: string;
  title: string;
  artist: string | null;
  format: string;
  genre: string | null;
  condition: string;
  price_cents: number;
  quantity: number;
  description: string | null;
  image_url: string | null;
  is_seller_listing: number;
  seller_user_id: string | null;
  status: ProductStatus;
  admin_note: string | null;
  created_at: string;
}

export interface Cart {
  id: string;
  user_id: string | null;
  guest_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

export interface CartLine {
  productId: string;
  title: string;
  artist: string | null;
  format: string;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  available: number;
  lineTotalCents: number;
}

export type OrderStatus = "processing" | "paid" | "shipped" | "cancelled" | "refunded";

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  guest_email: string | null;
  status: OrderStatus;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  total_cents: number;
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_option_name: string;
  payment_processor: string;
  payment_reference: string | null;
  carrier_id: string | null;
  tracking_number: string | null;
  placed_at: string;
  shipped_at: string | null;
  cancelled_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  title_snapshot: string;
  artist_snapshot: string | null;
  format_snapshot: string | null;
  unit_price_cents: number;
  quantity: number;
}

export interface MessageThread {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  guest_name: string | null;
  order_id: string | null;
  subject: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  thread_id: string;
  sender: "customer" | "admin";
  body: string;
  created_at: string;
}

export interface TaxRate {
  id: string;
  state_code: string;
  rate_percent: number;
  label: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string | null;
  flat_rate_cents: number;
  is_active: number;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  is_active: number;
  sort_order: number;
  created_at: string;
}

export interface Genre {
  id: string;
  name: string;
  is_active: number;
  sort_order: number;
  created_at: string;
}

export interface Artist {
  id: string;
  name: string;
  created_at: string;
}

export interface Carrier {
  id: string;
  name: string;
  tracking_url_template: string | null;
  is_active: number;
  sort_order: number;
  created_at: string;
}

export type BlogPostStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  author_user_id: string | null;
  status: BlogPostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  status: "visible" | "hidden";
  created_at: string;
}

export interface SiteSettings {
  id: string;
  header_bg_image_url: string | null;
  updated_at: string;
}
