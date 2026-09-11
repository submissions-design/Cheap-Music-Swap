"use client";

export default function DeleteTaxonomyButton({
  action,
  id,
  label,
  itemName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
  itemName: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete "${itemName}"? Existing products keep their current value, but this heading will no longer appear in navigation.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn btn-danger btn-sm">
        {label}
      </button>
    </form>
  );
}
