import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * Saves an uploaded cover image (from a <input type="file"> field in a
 * multipart Server Action submission) to public/uploads/<subdir>/ and
 * returns the public URL path to store on the record (e.g. products.image_url).
 *
 * Returns null when no file was submitted (empty file inputs arrive as a
 * File with size 0 and an empty name) so callers can fall back to "leave
 * the existing image unchanged."
 *
 * Note: files are written to the local filesystem, which is fine for this
 * single-server prototype. Swap this for S3/Cloud Storage before deploying
 * to any environment with an ephemeral or multi-instance filesystem.
 */
export async function saveUploadedImage(file: File | null, subdir: string): Promise<string | null> {
  if (!file || file.size === 0 || !file.name) return null;

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error("Cover image must be a JPEG, PNG, WebP, or GIF file.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Cover image must be smaller than 8MB.");
  }

  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return `/uploads/${subdir}/${filename}`;
}
