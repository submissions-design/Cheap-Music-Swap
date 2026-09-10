import { chromium } from "playwright";
import fs from "node:fs";

const pages = [
  { path: "/", name: "home" },
  { path: "/shop", name: "shop" },
  { path: "/shop/product/" + process.env.PID, name: "product" },
  { path: "/cart", name: "cart" },
  { path: "/checkout", name: "checkout" },
  { path: "/account", name: "account" },
];

const outDir = "/tmp/screens";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

for (const viewport of [{ w: 1280, h: 900, tag: "desktop" }, { w: 390, h: 844, tag: "mobile" }]) {
  const context = await browser.newContext({ viewport: { width: viewport.w, height: viewport.h } });
  const page = await context.newPage();
  for (const p of pages) {
    if (p.path.includes("undefined")) continue;
    try {
      await page.goto(`http://localhost:3000${p.path}`, { waitUntil: "networkidle", timeout: 15000 });
      await page.screenshot({ path: `${outDir}/${p.name}-${viewport.tag}.png` });
      console.log(`OK ${p.name} ${viewport.tag}`);
    } catch (e) {
      console.log(`FAIL ${p.name} ${viewport.tag}: ${e.message}`);
    }
  }
  await context.close();
}

await browser.close();
