import Link from "next/link";
import { listAllPostsAdmin } from "@/lib/db/repo";

export default async function AdminBlogPage() {
  const posts = listAllPostsAdmin();

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-xl font-bold">Blog</h1>
        <Link href="/admin/blog/new" className="btn btn-primary btn-sm">
          + New Post
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs text-ink-muted border-b border-border">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Published</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-2 pr-4">
                  <Link href={`/admin/blog/${p.id}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  <span className="badge capitalize">{p.status}</span>
                </td>
                <td className="py-2 pr-4 text-ink-muted">
                  {p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}
                </td>
                <td className="py-2 pr-4">
                  <Link href={`/admin/blog/${p.id}`} className="btn btn-secondary btn-sm">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-ink-muted">
                  No posts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
