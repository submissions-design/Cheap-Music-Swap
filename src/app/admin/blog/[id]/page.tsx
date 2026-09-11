import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostById, listCommentsForPostWithAuthor } from "@/lib/db/repo";
import PostForm from "@/components/admin/PostForm";
import DeletePostButton from "@/components/admin/DeletePostButton";
import { hideCommentAction, unhideCommentAction, deleteCommentAction } from "@/lib/actions/blog.actions";

export default async function EditBlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const post = getPostById(id);
  if (!post) notFound();

  const comments = listCommentsForPostWithAuthor(post.id, true);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/blog" className="text-sm text-ink-muted hover:underline">
        &larr; Back to Blog
      </Link>
      <div className="flex items-center justify-between my-4 flex-wrap gap-2">
        <h1 className="text-xl font-bold">Edit Post</h1>
        <div className="flex items-center gap-2">
          {post.status === "published" && (
            <Link href={`/blog/${post.slug}`} target="_blank" className="btn btn-secondary btn-sm">
              View Live
            </Link>
          )}
          <DeletePostButton postId={post.id} />
        </div>
      </div>
      {created === "1" && <p className="alert-success mb-4">Post created.</p>}
      <PostForm post={post} />

      <div className="mt-8">
        <h2 className="font-semibold mb-3">Comments ({comments.length})</h2>
        {comments.length === 0 && <p className="text-sm text-ink-muted">No comments yet.</p>}
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="card p-3 flex items-start justify-between gap-3">
              <div className="text-sm">
                <p className="text-xs text-ink-muted mb-1">
                  {c.author_name} · {new Date(c.created_at).toLocaleString()}
                  {c.status === "hidden" && <span className="badge ml-2">Hidden</span>}
                </p>
                <p className="whitespace-pre-wrap">{c.body}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {c.status === "visible" ? (
                  <form action={hideCommentAction}>
                    <input type="hidden" name="commentId" value={c.id} />
                    <input type="hidden" name="postId" value={post.id} />
                    <input type="hidden" name="slug" value={post.slug} />
                    <button type="submit" className="btn btn-secondary btn-sm">
                      Hide
                    </button>
                  </form>
                ) : (
                  <form action={unhideCommentAction}>
                    <input type="hidden" name="commentId" value={c.id} />
                    <input type="hidden" name="postId" value={post.id} />
                    <input type="hidden" name="slug" value={post.slug} />
                    <button type="submit" className="btn btn-secondary btn-sm">
                      Unhide
                    </button>
                  </form>
                )}
                <form action={deleteCommentAction}>
                  <input type="hidden" name="commentId" value={c.id} />
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="slug" value={post.slug} />
                  <button type="submit" className="btn btn-danger btn-sm">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
