import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth.actions";

const NAV = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/orders", label: "Order History" },
  { href: "/account/messages", label: "Messages" },
  { href: "/account/payment-methods", label: "Payment Options" },
  { href: "/account/profile", label: "Account Information" },
  { href: "/account/sell", label: "Sell Your Music" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");

  return (
    <div className="container-page py-10">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 shrink-0">
          <div className="card p-4 mb-4">
            <p className="text-sm font-semibold">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-ink-muted truncate">{user.email}</p>
          </div>
          <nav className="space-y-0.5 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded px-3 py-2 hover:bg-surface-muted">
                {item.label}
              </Link>
            ))}
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
