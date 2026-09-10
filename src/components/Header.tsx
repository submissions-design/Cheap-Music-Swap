import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentCartSummary } from "@/lib/cart";
import { listDistinctFormats, listDistinctGenres, countByArtist } from "@/lib/db/repo";
import SearchBar from "./SearchBar";

export default async function Header() {
  const [user, cart, formats, genres, artists] = await Promise.all([
    getCurrentUser(),
    getCurrentCartSummary(),
    Promise.resolve(listDistinctFormats()),
    Promise.resolve(listDistinctGenres()),
    Promise.resolve(countByArtist(10)),
  ]);

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border">
      <div className="bg-brand text-brand-contrast text-xs">
        <div className="container-page flex items-center justify-between gap-3 py-1.5">
          <span className="hidden sm:inline truncate">Buying and selling CDs, vinyl, and turntable gear.</span>
          <div className="flex gap-4 shrink-0 ml-auto sm:ml-0">
            <Link href="/help" className="hover:underline">
              Help
            </Link>
            <Link href="/contact" className="hover:underline">
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page flex items-center gap-4 py-3 flex-wrap">
        <Link href="/" className="shrink-0 font-display text-2xl font-bold text-brand">
          Cheap Music Swap
        </Link>

        <div className="flex-1 min-w-[220px]">
          <SearchBar />
        </div>

        <nav className="flex items-center gap-3 text-sm shrink-0">
          <Link href="/cart" className="btn btn-secondary btn-sm" aria-label="Shopping cart">
            Cart{cart.itemCount > 0 ? ` (${cart.itemCount})` : ""}
          </Link>
          {user ? (
            <Link href={user.role === "admin" ? "/admin" : "/account"} className="btn btn-primary btn-sm">
              {user.role === "admin" ? "Admin" : `Hi, ${user.first_name}`}
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="border-t border-border bg-surface-muted">
        <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-2 py-2 text-sm">
          <TopNavDropdown label="Format" queryKey="format" options={formats} />
          <TopNavDropdown label="Genre" queryKey="genre" options={genres} />
          <TopNavDropdown label="Artist" queryKey="artist" options={artists.map((a) => a.artist)} />
          <Link href="/shop?category=accessories" className="font-medium hover:text-brand">
            Accessories
          </Link>
          <Link href="/shop?category=other" className="font-medium hover:text-brand">
            Other
          </Link>
          <Link href="/shop" className="font-medium hover:text-brand">
            Browse All
          </Link>
        </div>
      </div>
    </header>
  );
}

function TopNavDropdown({ label, queryKey, options }: { label: string; queryKey: string; options: string[] }) {
  return (
    <div className="group relative">
      <button type="button" className="font-medium hover:text-brand flex items-center gap-1">
        {label}
        <span aria-hidden className="text-xs">
          ▾
        </span>
      </button>
      <div className="invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 top-full pt-2 z-50">
        <div className="card shadow-lg p-2 max-h-80 overflow-y-auto min-w-[200px] grid grid-cols-1 gap-0.5">
          {options.length === 0 && <span className="px-2 py-1 text-ink-muted text-xs">None yet</span>}
          {options.map((opt) => (
            <Link
              key={opt}
              href={`/shop?${queryKey}=${encodeURIComponent(opt)}`}
              className="px-2 py-1.5 rounded hover:bg-surface-muted whitespace-nowrap"
            >
              {opt}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
