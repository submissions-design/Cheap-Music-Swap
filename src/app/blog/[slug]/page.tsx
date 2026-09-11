import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, listCommentsForPostWithAuthor } from "@/lib/db/repo";
import { getCurrentUser } from "@/lib/auth";
import CommentForm from "@/components/blog/CommentForm";
import SafeImage from "@/components/SafeImage";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const [user, comments] = [await getCurrentUser(), listCommentsForPostWithAuthor(post.id)];

  return (
    <div className="container-page py-8 max-w-3xl">
      <Link href="/blog" className="text-sm text-ink-muted hover:underline">
        &larr; Back to Blog
      </Link>

      <article className="mt-4">
        {post.cover_image_url && (
          <SafeImage
            src={post.cover_image_url}
            alt=""
            className="w-full max-h-96 object-cover rounded mb-4"
            fallback={<></>}
          />
        )}
        <h1 className="text-2xl font-bold mb-1">{post.title}</h1>
        <p className="text-xs text-ink-muted mb-6">
          {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
        </p>
        <div className="prose text-sm whitespace-pre-wrap">{post.body}</div>
      </article>

      <div className="mt-10">
        <h2 className="font-semibold mb-3">Comments ({comments.length})</h2>
        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="card p-3 text-sm">
              <p className="text-xs text-ink-muted mb-1">
                {c.author_name} · {new Date(c.created_at).toLocaleString()}
              </p>
              <p className="whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-ink-muted">No comments yet.</p>}
        </div>

        {user ? (
          <CommentForm postId={post.id} slug={post.slug} />
        ) : (
          <p className="text-sm text-ink-muted">
            <Link href={`/login?next=${encodeURIComponent(`/blog/${post.slug}`)}`} className="text-brand hover:underline">
              Log in
            </Link>{" "}
            to leave a comment.
          </p>
        )}
      </div>
    </div>
  );
}
