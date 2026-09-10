import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listThreadsByUser } from "@/lib/db/repo";
import { sendNewMessageAction } from "@/lib/actions/messages.actions";
import NewMessageForm from "@/components/NewMessageForm";

export default async function MessagesPage() {
  const user = await requireUser("/account/messages");
  const threads = listThreadsByUser(user.id);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Messages</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold mb-3 text-sm">Your Threads</h2>
          {threads.length === 0 ? (
            <p className="text-sm text-ink-muted">No messages yet.</p>
          ) : (
            <div className="space-y-2">
              {threads.map((t) => (
                <Link key={t.id} href={`/account/messages/${t.id}`} className="card p-3 flex items-center justify-between hover:shadow-md text-sm">
                  <span className="font-medium line-clamp-1">{t.subject}</span>
                  <span className="badge">{t.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold mb-3 text-sm">Send a New Message</h2>
          <NewMessageForm action={sendNewMessageAction} isLoggedIn />
        </div>
      </div>
    </div>
  );
}
