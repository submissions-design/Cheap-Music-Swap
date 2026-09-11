"use client";

import { useActionState } from "react";
import { createListingAction } from "@/lib/actions/listings.actions";
import { FormAlert } from "@/components/AuthForm";
import type { Category, Genre, Artist } from "@/lib/db/types";

const CONDITIONS = ["New", "Used - Like New", "Used - Good", "Used - Fair"];

export default function CreateListingForm({
  categories,
  genres,
  artists,
}: {
  categories: Category[];
  genres: Genre[];
  artists: Artist[];
}) {
  const [state, formAction, pending] = useActionState(createListingAction, {});

  return (
    <form action={formAction} className="card p-5 grid sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="title">Title</label>
        <input id="title" name="title" required className="field-input" placeholder="e.g. Abbey Road" />
      </div>
      <div>
        <label className="field-label" htmlFor="artist">Artist</label>
        <input id="artist" name="artist" list="sell-artist-options" className="field-input" />
        <datalist id="sell-artist-options">
          {artists.map((a) => (
            <option key={a.id} value={a.name} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="field-label" htmlFor="genre">Genre</label>
        <input id="genre" name="genre" list="sell-genre-options" className="field-input" />
        <datalist id="sell-genre-options">
          {genres.map((g) => (
            <option key={g.id} value={g.name} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="field-label" htmlFor="format">Category</label>
        <select id="format" name="format" required className="field-input" defaultValue="">
          <option value="" disabled>Choose...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="condition">Condition</label>
        <select id="condition" name="condition" required className="field-input" defaultValue="">
          <option value="" disabled>Choose...</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="price">Price ($)</label>
        <input id="price" name="price" type="number" min={0.01} step={0.01} required className="field-input" />
      </div>
      <div>
        <label className="field-label" htmlFor="quantity">Quantity</label>
        <input id="quantity" name="quantity" type="number" min={1} defaultValue={1} className="field-input" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="imageUrl">Photo URL (optional)</label>
        <input id="imageUrl" name="imageUrl" className="field-input" placeholder="https://..." />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="description">Description</label>
        <textarea id="description" name="description" required rows={4} className="field-input" />
      </div>
      <div className="sm:col-span-2">
        <FormAlert state={state} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Submitting..." : "Submit Listing for Approval"}
        </button>
      </div>
    </form>
  );
}
