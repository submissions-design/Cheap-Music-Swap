"use client";

import { useState } from "react";

/**
 * Wraps a plain <img> with an onError fallback. Product/blog cover images
 * can come from an admin-entered URL, a marketplace seller's URL, or a
 * local upload that's since been removed — any of those can 404 or point
 * somewhere unreachable. A bare <img> shows the browser's broken-image
 * icon in that case; this swaps in the same placeholder used when there's
 * no image at all, so a dead link never shows as a broken graphic.
 */
export default function SafeImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) return <>{fallback}</>;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setErrored(true)} />;
}
