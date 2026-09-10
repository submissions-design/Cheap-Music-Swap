import Link from "next/link";
import { countByFormat, countByGenre, countByArtist } from "@/lib/db/repo";

export default function CategorySidebar({ active }: { active: { format?: string; genre?: string; artist?: string; category?: string } }) {
  const formats = countByFormat();
  const genres = countByGenre(8);
  const artists = countByArtist(8);

  const accessoriesCount = formats.find((f) => f.format === "Accessory")?.count ?? 0;
  const otherCount = formats.find((f) => f.format === "Other")?.count ?? 0;
  const browsableFormats = formats.filter((f) => f.format !== "Accessory" && f.format !== "Other");

  return (
    <aside className="w-full md:w-56 shrink-0 space-y-6">
      <SidebarGroup title="Format">
        {browsableFormats.map((f) => (
          <SidebarLink key={f.format} href={`/shop?format=${encodeURIComponent(f.format)}`} label={f.format} count={f.count} active={active.format === f.format} />
        ))}
      </SidebarGroup>

      <SidebarGroup title="Genre">
        {genres.map((g) => (
          <SidebarLink key={g.genre} href={`/shop?genre=${encodeURIComponent(g.genre)}`} label={g.genre} count={g.count} active={active.genre === g.genre} />
        ))}
      </SidebarGroup>

      <SidebarGroup title="Artist">
        {artists.map((a) => (
          <SidebarLink key={a.artist} href={`/shop?artist=${encodeURIComponent(a.artist)}`} label={a.artist} count={a.count} active={active.artist === a.artist} />
        ))}
      </SidebarGroup>

      <SidebarGroup title="More">
        <SidebarLink href="/shop?category=accessories" label="Accessories" count={accessoriesCount} active={active.category === "accessories"} />
        <SidebarLink href="/shop?category=other" label="Other" count={otherCount} active={active.category === "other"} />
      </SidebarGroup>

      <Link href="/shop" className="text-xs text-brand hover:underline">
        Clear filters
      </Link>
    </aside>
  );
}

function SidebarGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-ink-muted mb-2">{title}</h3>
      <ul className="space-y-1 text-sm">{children}</ul>
    </div>
  );
}

function SidebarLink({ href, label, count, active }: { href: string; label: string; count: number; active?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center justify-between rounded px-2 py-1 hover:bg-surface-muted ${active ? "bg-surface-muted font-semibold text-brand" : ""}`}
      >
        <span className="truncate">{label}</span>
        <span className="text-ink-muted text-xs">{count}</span>
      </Link>
    </li>
  );
}
