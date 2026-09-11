"use client";

import { useActionState } from "react";
import { addCommentAction } from "@/lib/actions/blog.actions";
import { FormAlert } from "@/components/AuthForm";

export default function CommentForm({ postId, slug }: { postId: string; slug: string }) {
  const [state, formAction, pending] = useActionState(addCommentAction, {});

  return (
    <form action={formAction} className="card p-4 space-y-3">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      <textarea name="body" required rows={3} className="field-input" placeholder="Add a comment..." />
      <FormAlert state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
        {pending ? "Posting..." : "Post Comment"}
      </button>
    </form>
  );
}
