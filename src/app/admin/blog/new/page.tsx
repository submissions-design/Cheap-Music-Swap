import Link from "next/link";
import PostForm from "@/components/admin/PostForm";

export default function NewBlogPostPage() {
  return (
    <div className="max-w-2xl">
      <Link href="/admin/blog" className="text-sm text-ink-muted hover:underline">
        &larr; Back to Blog
      </Link>
      <h1 className="text-xl font-bold my-4">New Post</h1>
      <PostForm />
    </div>
  );
}
