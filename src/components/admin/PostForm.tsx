"use client";

import { useActionState } from "react";
import { createPostAction, updatePostAction } from "@/lib/actions/blog.actions";
import { FormAlert } from "@/components/AuthForm";
import type { BlogPost } from "@/lib/db/types";

export default function PostForm({ post }: { post?: BlogPost }) {
  const isEdit = Boolean(post);
  const [state, formAction, pending] = useActionState(isEdit ? updatePostAction : createPostAction, {});

  return (
    <form action={formAction} encType="multipart/form-data" className="card p-5 space-y-4">
      {isEdit && <input type="hidden" name="postId" value={post!.id} />}

      <div>
        <label className="field-label" htmlFor="title">Title</label>
        <input id="title" name="title" required className="field-input" defaultValue={post?.title} />
      </div>

      <div>
        <label className="field-label" htmlFor="excerpt">Excerpt (optional, shown on the blog index)</label>
        <input id="excerpt" name="excerpt" className="field-input" defaultValue={post?.excerpt ?? ""} />
      </div>

      <div>
        <label className="field-label" htmlFor="coverImage">
          Cover image {isEdit ? "(upload to replace)" : "(optional)"}
        </label>
        {isEdit && post?.cover_image_url && (
          <div className="mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url} alt="" width={160} height={100} className="rounded border border-border object-cover" />
          </div>
        )}
        <input id="coverImage" name="coverImage" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="field-input" />
      </div>

      <div>
        <label className="field-label" htmlFor="body">Body</label>
        <textarea id="body" name="body" required rows={14} className="field-input" defaultValue={post?.body ?? ""} />
      </div>

      <div>
        <label className="field-label" htmlFor="status">Status</label>
        <select id="status" name="status" className="field-input max-w-xs" defaultValue={post?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <FormAlert state={state} />

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving..." : isEdit ? "Save Changes" : "Create Post"}
      </button>
    </form>
  );
}
