import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="container-page py-16 max-w-md text-center">
      <h1 className="text-2xl font-bold mb-3">Confirm Your Email</h1>
      <p className="text-ink-muted mb-6">
        Your account was created. We've sent a confirmation link to your email address — click it to verify your
        account details. (In this demo build, the email is printed to the server log instead of actually being sent —
        see README.md.)
      </p>
      <Link href="/account" className="btn btn-primary">
        Go to My Account
      </Link>
    </div>
  );
}
