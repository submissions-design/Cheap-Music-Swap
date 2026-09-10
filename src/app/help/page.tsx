import Link from "next/link";

const FAQS: { q: string; a: string }[] = [
  { q: "How do I track my order?", a: "Log in and go to Account → Order History to see the status of every order you've placed." },
  { q: "Can I cancel an order?", a: "Yes — as long as it hasn't shipped yet. Open the order from Account → Order History and choose Cancel Order." },
  { q: "Do I need an account to buy something?", a: "No — you can check out as a guest. Creating an account lets you save addresses and payment methods, and track order history." },
  { q: "How do I sell my own CDs or vinyl?", a: "Register for an account, then go to Account → Sell Your Music to submit a listing. Listings are reviewed before they go live." },
  { q: "What condition are used items in?", a: "Each listing shows its condition (New, Used - Like New, Used - Good, or Used - Fair) along with a description." },
  { q: "What payment methods are accepted?", a: "Card payments processed securely at checkout. The specific processor is configurable — check with the store for current options." },
  { q: "How is shipping cost calculated?", a: "Choose a shipping method at checkout; the cost is shown before you place your order." },
];

export default function HelpPage() {
  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Help &amp; FAQ</h1>
      <p className="text-ink-muted mb-8">
        Can't find what you're looking for? <Link href="/contact" className="text-brand hover:underline">Contact us</Link>.
      </p>
      <div className="space-y-4">
        {FAQS.map((item) => (
          <details key={item.q} className="card p-4">
            <summary className="font-semibold cursor-pointer">{item.q}</summary>
            <p className="text-sm text-ink-muted mt-2">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
