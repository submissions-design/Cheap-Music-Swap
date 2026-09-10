import Link from "next/link";
import { listAllThreads } from "@/lib/db/repo";

export default async function AdminMessagesPage() {
  const threads = listAllThreads();

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Messages</h1>
      <div className="space-y-2">
        {threads.map((t) => (
          <Link key={t.id} href={`/admin/messages/${t.id}`} className="card p-3 flex items-center justify-between hover:shadow-md text-sm">
            <span className="line-clamp-1">{t.subject}</span>
            <span className="text-ink-muted text-xs">{t.guest_email || "Registered customer"}</span>
            <span className="badge">{t.status}</span>
          </Link>
        ))}
        {threads.length === 0 && <p className="text-sm text-ink-muted">No messages yet.</p>}
      </div>
    </div>
  );
}
