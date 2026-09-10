import Link from "next/link";
import { verifyEmailAction } from "@/lib/actions/auth.actions";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : { ok: false };

  return (
    <div className="container-page py-16 max-w-md text-center">
      {result.ok ? (
        <>
          <h1 className="text-2xl font-bold mb-3">Email Verified</h1>
          <p className="text-ink-muted mb-6">Your account details are confirmed. You're all set.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-3">Verification Link Invalid</h1>
          <p className="text-ink-muted mb-6">This link may have expired or already been used.</p>
        </>
      )}
      <Link href="/account" className="btn btn-primary">
        Go to My Account
      </Link>
    </div>
  );
}
