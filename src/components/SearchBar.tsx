"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
      }}
      className="flex w-full"
    >
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search titles, artists, genres..."
        aria-label="Search the catalog"
        className="field-input rounded-r-none"
      />
      <button type="submit" className="btn btn-primary rounded-l-none">
        Search
      </button>
    </form>
  );
}
