import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth.actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/listings", label: "Seller Listings" },
  { href: "/admin/categories", label: "Categories & Genres" },
  { href: "/admin/settings", label: "Cart Settings" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/appearance", label: "Appearance" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="container-page py-10">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 shrink-0">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted mb-2">Admin</p>
          <nav className="space-y-0.5 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded px-3 py-2 hover:bg-surface-muted">
                {item.label}
              </Link>
            ))}
            <Link href="/account" className="block rounded px-3 py-2 hover:bg-surface-muted text-ink-muted">
              My Account
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="block w-full text-left rounded px-3 py-2 hover:bg-surface-muted text-danger">
                Log Out
              </button>
            </form>
          </nav>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
