import { notFound } from "next/navigation";
import { getThreadById, getMessagesForThread } from "@/lib/db/repo";
import { adminReplyAction } from "@/lib/actions/messages.actions";

export default async function AdminThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const thread = getThreadById(threadId);
  if (!thread) notFound();
  const messages = getMessagesForThread(threadId);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-1">{thread.subject}</h1>
      <p className="text-xs text-ink-muted mb-6">From {thread.guest_name || "registered customer"} ({thread.guest_email || "account email"})</p>

      <div className="space-y-3 mb-6">
        {messages.map((m) => (
          <div key={m.id} className={`card p-3 max-w-[85%] ${m.sender === "admin" ? "ml-auto bg-surface-muted" : ""}`}>
            <p className="text-xs text-ink-muted mb-1">{m.sender === "admin" ? "You" : "Customer"} · {new Date(m.created_at).toLocaleString()}</p>
            <p className="text-sm whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>

      <form action={adminReplyAction} className="card p-4 space-y-3">
        <input type="hidden" name="threadId" value={thread.id} />
        <textarea name="body" required rows={3} className="field-input" placeholder="Write a reply..." />
        <button type="submit" className="btn btn-primary btn-sm">
          Send Reply
        </button>
      </form>
    </div>
  );
}
