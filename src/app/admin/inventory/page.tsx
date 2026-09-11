import Link from "next/link";
import { listProductsForAdmin } from "@/lib/db/repo";
import { formatMoney } from "@/lib/money";
import { setProductQuantityAction } from "@/lib/actions/admin-products.actions";

const STATUSES = ["all", "active", "pending_approval", "rejected", "inactive"];

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q || "";
  const status = sp.status || "all";
  const page = Math.max(1, Number(sp.page || 1));

  const { items, total, pageSize } = listProductsForAdmin({ q, status, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-xl font-bold">Inventory</h1>
        <Link href="/admin/inventory/new" className="btn btn-primary btn-sm">
          + Add Product
        </Link>
      </div>

      <form className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="field-label" htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Title, artist, or SKU" className="field-input" />
        </div>
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status} className="field-input">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary btn-sm">
          Filter
        </button>
      </form>

      <div className="text-xs text-ink-muted mb-2">
        {total} product{total === 1 ? "" : "s"}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs text-ink-muted border-b border-border">
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4">SKU</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Price</th>
              <th className="py-2 pr-4">Stock</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-2 pr-4">
                  <Link href={`/admin/inventory/${p.id}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  {p.artist && <div className="text-xs text-ink-muted">{p.artist}</div>}
                </td>
                <td className="py-2 pr-4 text-ink-muted">{p.sku}</td>
                <td className="py-2 pr-4">{p.format}</td>
                <td className="py-2 pr-4">{formatMoney(p.price_cents)}</td>
                <td className="py-2 pr-4">
                  <form action={setProductQuantityAction} className="flex items-center gap-1">
                    <input type="hidden" name="productId" value={p.id} />
                    <input
                      type="number"
                      name="quantity"
                      min={0}
                      defaultValue={p.quantity}
                      className="field-input w-20 py-1"
                    />
                    <button type="submit" className="btn btn-secondary btn-sm">
                      Set
                    </button>
                  </form>
                  {p.quantity <= 2 && (
                    <div className="text-xs text-danger mt-1">
                      {p.quantity === 0 ? "Out of stock" : "Low stock"}
                    </div>
                  )}
                </td>
                <td className="py-2 pr-4">
                  <span className="badge capitalize">{p.status.replace("_", " ")}</span>
                </td>
                <td className="py-2 pr-4">
                  <Link href={`/admin/inventory/${p.id}`} className="btn btn-secondary btn-sm">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-ink-muted">
                  No products match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/admin/inventory?q=${encodeURIComponent(q)}&status=${status}&page=${n}`}
              className={`btn btn-sm ${n === page ? "btn-primary" : "btn-secondary"}`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
