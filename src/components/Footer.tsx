import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface-muted">
      <div className="container-page py-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4 text-sm">
        <div>
          <div className="font-display text-lg font-bold text-brand mb-2">Cheap Music Swap</div>
          <p className="text-ink-muted">Buy, sell, and swap CDs, vinyl, and the gear to play them.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Shop</div>
          <ul className="space-y-1.5 text-ink-muted">
            <li><Link href="/shop" className="hover:text-brand">Browse All</Link></li>
            <li><Link href="/shop?category=accessories" className="hover:text-brand">Accessories</Link></li>
            <li><Link href="/account/sell" className="hover:text-brand">Sell Your Music</Link></li>
            <li><Link href="/blog" className="hover:text-brand">Blog</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Account</div>
          <ul className="space-y-1.5 text-ink-muted">
            <li><Link href="/login" className="hover:text-brand">Log In</Link></li>
            <li><Link href="/register" className="hover:text-brand">Register</Link></li>
            <li><Link href="/account/orders" className="hover:text-brand">Order History</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Support</div>
          <ul className="space-y-1.5 text-ink-muted">
            <li><Link href="/help" className="hover:text-brand">Help</Link></li>
            <li><Link href="/contact" className="hover:text-brand">Contact Us</Link></li>
            <li><Link href="/privacy" className="hover:text-brand">Privacy Notice</Link></li>
            <li><Link href="/terms" className="hover:text-brand">Terms of Use</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page py-4 text-xs text-ink-muted">
          &copy; {new Date().getFullYear()} Cheap Music Swap. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
