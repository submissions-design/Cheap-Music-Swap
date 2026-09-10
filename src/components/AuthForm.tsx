import type { FormState } from "@/lib/actions/auth.actions";

export function FormAlert({ state }: { state: FormState }) {
  if (state.error) return <p className="alert-error">{state.error}</p>;
  if (state.success) return <p className="alert-success">{state.success}</p>;
  return null;
}
