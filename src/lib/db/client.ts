import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

// -----------------------------------------------------------------------
// Database connection
//
// Uses Node's built-in `node:sqlite` module so the app runs with zero
// external services for development and small deployments. For a larger
// production deployment, swap this file for a Postgres client (e.g. `pg`
// or `postgres`) — every other file talks to the small repository
// functions at the bottom of this file, not to SQLite directly, so the
// swap is contained here and in schema.sql.
// -----------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __cmsDb: DatabaseSync | undefined;
}

// node:sqlite returns rows as null-prototype objects. That's fine for
// server-only code, but React Server Components refuse to pass anything
// but plain objects across the server -> client component boundary. Rather
// than remembering to spread every row at every call site, patch `prepare`
// once here so every row returned anywhere in the app is already a plain
// object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function plainify(row: any): any {
  return row && typeof row === "object" ? { ...row } : row;
}

function withPlainRows(db: DatabaseSync): DatabaseSync {
  const originalPrepare = db.prepare.bind(db);
  db.prepare = ((sql: string) => {
    const stmt = originalPrepare(sql);
    const originalGet = stmt.get.bind(stmt);
    const originalAll = stmt.all.bind(stmt);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stmt.get = ((...args: any[]) => plainify(originalGet(...args))) as typeof stmt.get;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stmt.all = ((...args: any[]) => (originalAll(...args) as any[]).map(plainify)) as typeof stmt.all;
    return stmt;
  }) as typeof db.prepare;
  return db;
}

function openDb(): DatabaseSync {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "app.db");
  const db = withPlainRows(new DatabaseSync(dbPath));
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");

  const schemaPath = path.join(process.cwd(), "src", "lib", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);

  return db;
}

export function getDb(): DatabaseSync {
  if (!global.__cmsDb) {
    global.__cmsDb = openDb();
    seedIfEmpty(global.__cmsDb);
  }
  return global.__cmsDb;
}

// -----------------------------------------------------------------------
// First-run seed data (idempotent — only runs when the products table is
// empty). Gives the storefront realistic-looking inventory immediately.
// Replace with the client's real inventory export whenever it's ready —
// see scripts/seed.ts for a standalone re-runnable version of this data.
// -----------------------------------------------------------------------

function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number };
  if (row.c > 0) return;

  const insertProduct = db.prepare(`
    INSERT INTO products (id, sku, title, artist, format, genre, condition, price_cents, quantity, description, image_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  for (const p of seedProducts()) {
    insertProduct.run(
      randomUUID(),
      p.sku,
      p.title,
      p.artist ?? null,
      p.format,
      p.genre ?? null,
      p.condition,
      p.priceCents,
      p.quantity,
      p.description,
      p.imageUrl ?? null
    );
  }

  const insertTax = db.prepare(
    "INSERT INTO tax_rates (id, state_code, rate_percent, label) VALUES (?, ?, ?, ?)"
  );
  for (const t of seedTaxRates()) {
    insertTax.run(randomUUID(), t.state, t.rate, t.label);
  }

  const insertShipping = db.prepare(
    "INSERT INTO shipping_options (id, name, description, flat_rate_cents, is_active, sort_order) VALUES (?, ?, ?, ?, 1, ?)"
  );
  seedShippingOptions().forEach((s, i) => {
    insertShipping.run(randomUUID(), s.name, s.description, s.priceCents, i);
  });

  // Demo accounts: admin@cheapmusicswap.com / admin123, customer@example.com / customer123
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);
  insertUser.run(
    randomUUID(),
    "admin@cheapmusicswap.com",
    bcrypt.hashSync("admin123", 10),
    "Site",
    "Admin",
    null,
    "admin"
  );
  insertUser.run(
    randomUUID(),
    "customer@example.com",
    bcrypt.hashSync("customer123", 10),
    "Sample",
    "Customer",
    "555-010-1000",
    "customer"
  );
}

function seedTaxRates() {
  // Placeholder economic-nexus rates for demo purposes only — replace with
  // the client's real sales-tax table (or a tax API integration) before
  // going live. See README "Tax & shipping configuration".
  return [
    { state: "NY", rate: 8.0, label: "New York" },
    { state: "CA", rate: 7.25, label: "California" },
    { state: "TX", rate: 6.25, label: "Texas" },
    { state: "FL", rate: 6.0, label: "Florida" },
    { state: "NJ", rate: 6.625, label: "New Jersey" },
    { state: "PA", rate: 6.0, label: "Pennsylvania" },
  ];
}

function seedShippingOptions() {
  return [
    { name: "Standard (5-8 business days)", description: "USPS Media Mail / Ground Advantage", priceCents: 499 },
    { name: "Expedited (2-3 business days)", description: "Priority shipping", priceCents: 999 },
    { name: "Local Pickup", description: "Pick up at the shop, no shipping charge", priceCents: 0 },
  ];
}

function seedProducts() {
  const items: {
    sku: string;
    title: string;
    artist?: string;
    format: string;
    genre?: string;
    condition: string;
    priceCents: number;
    quantity: number;
    description: string;
    imageUrl?: string;
  }[] = [];

  const vinylCatalog: [string, string, string][] = [
    ["Kind of Blue", "Miles Davis", "Jazz"],
    ["Rumours", "Fleetwood Mac", "Rock"],
    ["Abbey Road", "The Beatles", "Rock"],
    ["Thriller", "Michael Jackson", "Pop"],
    ["Back in Black", "AC/DC", "Rock"],
    ["Songs in the Key of Life", "Stevie Wonder", "Soul"],
    ["Blue Train", "John Coltrane", "Jazz"],
    ["Born to Run", "Bruce Springsteen", "Rock"],
    ["What's Going On", "Marvin Gaye", "Soul"],
    ["Legend", "Bob Marley & The Wailers", "Reggae"],
    ["Nevermind", "Nirvana", "Alternative"],
    ["The Dark Side of the Moon", "Pink Floyd", "Rock"],
    ["Purple Rain", "Prince", "Pop"],
    ["Ramones", "Ramones", "Punk"],
    ["Blonde on Blonde", "Bob Dylan", "Folk"],
    ["Enter the Wu-Tang (36 Chambers)", "Wu-Tang Clan", "Hip-Hop"],
    ["Illmatic", "Nas", "Hip-Hop"],
    ["Random Access Memories", "Daft Punk", "Electronic"],
    ["Good Kid, M.A.A.D City", "Kendrick Lamar", "Hip-Hop"],
    ["Harvest", "Neil Young", "Folk"],
  ];

  const cdCatalog: [string, string, string][] = [
    ["OK Computer", "Radiohead", "Alternative"],
    ["The Chronic", "Dr. Dre", "Hip-Hop"],
    ["Jagged Little Pill", "Alanis Morissette", "Rock"],
    ["Ten", "Pearl Jam", "Rock"],
    ["The Miseducation of Lauryn Hill", "Lauryn Hill", "Soul"],
    ["Continuum", "John Mayer", "Pop"],
    ["Discovery", "Daft Punk", "Electronic"],
    ["21", "Adele", "Pop"],
    ["American Idiot", "Green Day", "Punk"],
    ["Ready to Die", "The Notorious B.I.G.", "Hip-Hop"],
    ["To Pimp a Butterfly", "Kendrick Lamar", "Hip-Hop"],
    ["Blackstar", "David Bowie", "Rock"],
    ["Voodoo", "D'Angelo", "Soul"],
    ["Currents", "Tame Impala", "Alternative"],
    ["Californication", "Red Hot Chili Peppers", "Rock"],
    ["Since I Left You", "The Avalanches", "Electronic"],
  ];

  const cassetteCatalog: [string, string, string][] = [
    ["Purple Rain", "Prince", "Pop"],
    ["Master of Puppets", "Metallica", "Metal"],
    ["Slippery When Wet", "Bon Jovi", "Rock"],
  ];

  let sku = 1000;
  for (const [title, artist, genre] of vinylCatalog) {
    const isUsed = sku % 3 === 0;
    items.push({
      sku: `VIN-${sku++}`,
      title,
      artist,
      format: "Vinyl",
      genre,
      condition: isUsed ? "Used - Good" : "New",
      priceCents: isUsed ? 1800 + (sku % 7) * 100 : 2800 + (sku % 5) * 150,
      quantity: 2 + (sku % 6),
      description: `${title} by ${artist} — 180g vinyl LP, ${isUsed ? "previously owned, sleeve and disc inspected for wear" : "factory sealed"}.`,
    });
  }
  for (const [title, artist, genre] of cdCatalog) {
    const isUsed = sku % 4 === 0;
    items.push({
      sku: `CD-${sku++}`,
      title,
      artist,
      format: "CD",
      genre,
      condition: isUsed ? "Used - Like New" : "New",
      priceCents: isUsed ? 599 + (sku % 5) * 50 : 999 + (sku % 6) * 100,
      quantity: 3 + (sku % 8),
      description: `${title} by ${artist} on CD. ${isUsed ? "Gently used, case and disc in great shape." : "Brand new, shrink-wrapped."}`,
    });
  }
  for (const [title, artist, genre] of cassetteCatalog) {
    items.push({
      sku: `CAS-${sku++}`,
      title,
      artist,
      format: "Cassette",
      genre,
      condition: "Used - Good",
      priceCents: 1200,
      quantity: 2,
      description: `${title} by ${artist} on cassette tape. Plays clean, case included.`,
    });
  }

  const gear: { title: string; brand: string; genre: string; price: number; qty: number; desc: string }[] = [
    { title: "AT-LP60X Turntable", brand: "Audio-Technica", genre: "Turntable", price: 14900, qty: 6, desc: "Fully automatic belt-drive turntable with built-in phono preamp." },
    { title: "Debut Carbon EVO Turntable", brand: "Pro-Ject", genre: "Turntable", price: 49900, qty: 3, desc: "Manual belt-drive turntable, carbon fiber tonearm." },
    { title: "T4 Turntable", brand: "Fluance", genre: "Turntable", price: 24900, qty: 4, desc: "High-fidelity turntable with Ortofon cartridge." },
  ];
  for (const g of gear) {
    items.push({
      sku: `TT-${sku++}`,
      title: g.title,
      artist: g.brand,
      format: "Turntable",
      genre: g.genre,
      condition: "New",
      priceCents: g.price,
      quantity: g.qty,
      description: g.desc,
    });
  }

  const accessories: { title: string; price: number; qty: number; desc: string }[] = [
    { title: "Replacement Stylus (Elliptical)", price: 2999, qty: 15, desc: "Universal replacement stylus for entry-level turntables." },
    { title: "Record Cleaning Kit", price: 1999, qty: 20, desc: "Carbon fiber brush, cleaning fluid, and microfiber cloth." },
    { title: "Outer Sleeves (50-pack)", price: 1299, qty: 30, desc: "Archival-quality poly outer sleeves for 12in vinyl." },
    { title: "Inner Sleeves, Anti-Static (25-pack)", price: 999, qty: 30, desc: "Rice-paper lined anti-static inner sleeves." },
    { title: "Vinyl Record Weight / Clamp", price: 3499, qty: 10, desc: "Stabilizes records during playback for cleaner sound." },
    { title: "Slipmat", price: 899, qty: 25, desc: "Felt turntable slipmat, standard 12in size." },
    { title: "Phono Preamp", price: 5999, qty: 8, desc: "Compact phono preamp for turntables without a built-in preamp." },
    { title: "CD Storage Binder (40-disc)", price: 1499, qty: 12, desc: "Zippered binder with acid-free sleeves for 40 CDs." },
  ];
  for (const a of accessories) {
    items.push({
      sku: `ACC-${sku++}`,
      title: a.title,
      format: "Accessory",
      genre: "Accessories",
      condition: "New",
      priceCents: a.price,
      quantity: a.qty,
      description: a.desc,
    });
  }

  items.push({
    sku: `OTH-${sku++}`,
    title: "Gift Card - $25",
    format: "Other",
    genre: "Gift Cards",
    condition: "New",
    priceCents: 2500,
    quantity: 999,
    description: "Digital gift card, redeemable storewide.",
  });
  items.push({
    sku: `OTH-${sku++}`,
    title: "Record Storage Crate",
    format: "Other",
    genre: "Storage",
    condition: "New",
    priceCents: 3499,
    quantity: 10,
    description: "Solid wood crate, holds up to 60 LPs.",
  });

  return items;
}
