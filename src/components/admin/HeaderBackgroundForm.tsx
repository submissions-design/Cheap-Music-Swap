"use client";

import { useActionState } from "react";
import { updateHeaderBackgroundAction } from "@/lib/actions/appearance.actions";
import { FormAlert } from "@/components/AuthForm";

export default function HeaderBackgroundForm() {
  const [state, formAction, pending] = useActionState(updateHeaderBackgroundAction, {});

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-3">
      <div>
        <label className="field-label" htmlFor="headerBgImage">Upload a new background image</label>
        <input
          id="headerBgImage"
          name="headerBgImage"
          type="file"
          required
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="field-input"
        />
        <p className="text-xs text-ink-muted mt-1">
          A wide, short image works best (e.g. 1600×150px or similar). A dark overlay is applied automatically so
          the banner text stays readable over any image.
        </p>
      </div>
      <FormAlert state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
        {pending ? "Uploading..." : "Upload & Apply"}
      </button>
    </form>
  );
}
