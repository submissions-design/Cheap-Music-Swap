import Link from "next/link";

export default function Pagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-8 pb-4" aria-label="Pagination">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`btn btn-secondary btn-sm ${page === 1 ? "pointer-events-none opacity-40" : ""}`}
      >
        ← Back
      </Link>
      {start > 1 && <span className="px-1 text-ink-muted">…</span>}
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={`btn btn-sm ${p === page ? "btn-primary" : "btn-secondary"}`}
        >
          {p}
        </Link>
      ))}
      {end < totalPages && <span className="px-1 text-ink-muted">…</span>}
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={`btn btn-secondary btn-sm ${page === totalPages ? "pointer-events-none opacity-40" : ""}`}
      >
        Next →
      </Link>
    </nav>
  );
}
