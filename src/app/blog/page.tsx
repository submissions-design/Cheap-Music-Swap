import Link from "next/link";
import { listPublishedPosts } from "@/lib/db/repo";

export default async function BlogIndexPage() {
  const posts = listPublishedPosts();

  return (
    <div className="container-page py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Blog</h1>
      {posts.length === 0 && <p className="text-ink-muted">No posts yet — check back soon.</p>}
      <div className="space-y-6">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="card p-5 block hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              {p.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover_image_url} alt="" className="w-28 h-28 rounded object-cover shrink-0" />
              )}
              <div>
                <h2 className="font-semibold text-lg">{p.title}</h2>
                <p className="text-xs text-ink-muted mb-2">
                  {p.published_at ? new Date(p.published_at).toLocaleDateString() : ""}
                </p>
                {p.excerpt && <p className="text-sm text-ink-muted line-clamp-2">{p.excerpt}</p>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
