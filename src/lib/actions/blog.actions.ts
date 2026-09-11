"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import {
  createPost,
  updatePost,
  deletePost,
  getPostById,
  addComment,
  setCommentStatus,
  deleteComment,
} from "@/lib/db/repo";
import { saveUploadedImage } from "@/lib/uploads";
import type { FormState } from "./auth.actions";

// --- Admin: authoring ---------------------------------------------------------

export async function createPostAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const status = String(formData.get("status") || "draft") === "published" ? "published" : "draft";

  if (!title || !body) return { error: "Title and body are required." };

  let coverImageUrl: string | null = null;
  try {
    coverImageUrl = await saveUploadedImage(formData.get("coverImage") as File | null, "blog");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save the cover image." };
  }

  const post = createPost({
    title,
    excerpt: excerpt || null,
    body,
    coverImageUrl,
    authorUserId: admin.id,
    status,
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect(`/admin/blog/${post.id}?created=1`);
}

export async function updatePostAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("postId") || "");
  const current = getPostById(id);
  if (!current) return { error: "Post not found." };

  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const status = String(formData.get("status") || "draft") === "published" ? "published" : "draft";

  if (!title || !body) return { error: "Title and body are required." };

  let coverImageUrl: string | undefined = undefined;
  try {
    const saved = await saveUploadedImage(formData.get("coverImage") as File | null, "blog");
    if (saved) coverImageUrl = saved;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save the cover image." };
  }

  updatePost(id, { title, excerpt: excerpt || null, body, coverImageUrl, status });

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${current.slug}`);
  return { success: "Post updated." };
}

export async function deletePostAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("postId") || "");
  if (id) deletePost(id);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

// --- Admin: comment moderation ---------------------------------------------------------

export async function hideCommentAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("commentId") || "");
  const slug = String(formData.get("slug") || "");
  if (id) setCommentStatus(id, "hidden");
  revalidatePath(`/admin/blog/${formData.get("postId") || ""}`);
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function unhideCommentAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("commentId") || "");
  const slug = String(formData.get("slug") || "");
  if (id) setCommentStatus(id, "visible");
  revalidatePath(`/admin/blog/${formData.get("postId") || ""}`);
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function deleteCommentAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("commentId") || "");
  const slug = String(formData.get("slug") || "");
  if (id) deleteComment(id);
  revalidatePath(`/admin/blog/${formData.get("postId") || ""}`);
  if (slug) revalidatePath(`/blog/${slug}`);
}

// --- Customer: comments ---------------------------------------------------------

export async function addCommentAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const postId = String(formData.get("postId") || "");
  const slug = String(formData.get("slug") || "");
  const body = String(formData.get("body") || "").trim();

  const user = await requireUser(`/blog/${slug}`);
  if (!body) return { error: "Write a comment first." };

  addComment({ postId, userId: user.id, body });
  revalidatePath(`/blog/${slug}`);
  return { success: "Comment posted." };
}
