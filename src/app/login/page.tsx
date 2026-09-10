import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="container-page py-14 max-w-md">
      <h1 className="text-2xl font-bold mb-1">Log In</h1>
      <p className="text-ink-muted text-sm mb-6">Welcome back to Cheap Music Swap.</p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
