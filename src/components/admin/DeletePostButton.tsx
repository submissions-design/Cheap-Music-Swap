"use client";

import { deletePostAction } from "@/lib/actions/blog.actions";

export default function DeletePostButton({ postId }: { postId: string }) {
  return (
    <form
      action={deletePostAction}
      onSubmit={(e) => {
        if (!confirm("Delete this post permanently? This can't be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <button type="submit" className="btn btn-danger btn-sm">
        Delete Post
      </button>
    </form>
  );
}
