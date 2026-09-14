import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Accept the second 'folder' argument to satisfy TypeScript
export async function saveUploadedImage(file: File | null, folder: string = "uploads"): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const extension = file.name.split('.').pop() || 'png';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
  
  // Organize files into folders within your R2 bucket
  const fileKey = `${folder}/${filename}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type || 'image/jpeg',
    })
  );

  // Return the complete public URL
  return `${process.env.R2_PUBLIC_URL}/${fileKey}`;
}

export const uploadFile = saveUploadedImage;
