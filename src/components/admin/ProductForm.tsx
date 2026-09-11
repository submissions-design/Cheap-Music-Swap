"use client";

import { useActionState } from "react";
import { createProductAdminAction, updateProductAction } from "@/lib/actions/admin-products.actions";
import { FormAlert } from "@/components/AuthForm";
import SafeImage from "@/components/SafeImage";
import type { Product, Category, Genre, Artist } from "@/lib/db/types";

const CONDITIONS = ["New", "Used - Like New", "Used - Good", "Used - Fair"];
const STATUSES = ["active", "pending_approval", "rejected", "inactive"];

export default function ProductForm({
  product,
  categories,
  genres,
  artists,
}: {
  product?: Product;
  categories: Category[];
  genres: Genre[];
  artists: Artist[];
}) {
  const isEdit = Boolean(product);
  const [state, formAction, pending] = useActionState(isEdit ? updateProductAction : createProductAdminAction, {});

  return (
    <form action={formAction} encType="multipart/form-data" className="card p-5 grid sm:grid-cols-2 gap-3">
      {isEdit && <input type="hidden" name="productId" value={product!.id} />}

      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="title">Title</label>
        <input id="title" name="title" required className="field-input" defaultValue={product?.title} />
      </div>

      <div>
        <label className="field-label" htmlFor="artist">Artist</label>
        <input id="artist" name="artist" list="artist-options" className="field-input" defaultValue={product?.artist ?? ""} />
        <datalist id="artist-options">
          {artists.map((a) => (
            <option key={a.id} value={a.name} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="field-label" htmlFor="genre">Genre</label>
        <input id="genre" name="genre" list="genre-options" className="field-input" defaultValue={product?.genre ?? ""} />
        <datalist id="genre-options">
          {genres.map((g) => (
            <option key={g.id} value={g.name} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="field-label" htmlFor="format">Category</label>
        <select id="format" name="format" required className="field-input" defaultValue={product?.format ?? ""}>
          <option value="" disabled>Choose...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor="condition">Condition</label>
        <select id="condition" name="condition" required className="field-input" defaultValue={product?.condition ?? ""}>
          <option value="" disabled>Choose...</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor="price">Price ($)</label>
        <input
          id="price"
          name="price"
          type="number"
          min={0.01}
          step={0.01}
          required
          className="field-input"
          defaultValue={product ? (product.price_cents / 100).toFixed(2) : undefined}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="quantity">Quantity in stock</label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min={0}
          className="field-input"
          defaultValue={product?.quantity ?? 0}
        />
      </div>

      {isEdit && (
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select id="status" name="status" className="field-input" defaultValue={product?.status}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>
      )}

      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="coverImage">
          Cover image {isEdit ? "(upload to replace)" : "(optional)"}
        </label>
        {isEdit && product?.image_url && (
          <div className="mb-2 w-24 h-24">
            <SafeImage
              src={product.image_url}
              alt=""
              className="w-24 h-24 rounded border border-border object-cover"
              fallback={<></>}
            />
          </div>
        )}
        <input id="coverImage" name="coverImage" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="field-input" />
      </div>

      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={4} className="field-input" defaultValue={product?.description ?? ""} />
      </div>

      <div className="sm:col-span-2">
        <FormAlert state={state} />
      </div>

      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
