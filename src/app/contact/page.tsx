import { getCurrentUser } from "@/lib/auth";
import { sendNewMessageAction } from "@/lib/actions/messages.actions";
import NewMessageForm from "@/components/NewMessageForm";

export default async function ContactPage() {
  const user = await getCurrentUser();
  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Contact Us</h1>
      <p className="text-ink-muted mb-6">
        Questions about an order, a listing, or anything else? Send us a message and we&rsquo;ll get back to you.
        Logged-in customers can also view replies under Account → Messages.
      </p>
      <NewMessageForm action={sendNewMessageAction} isLoggedIn={!!user} />
    </div>
  );
}
