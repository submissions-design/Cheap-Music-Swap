import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate a safe, unique filename
  const extension = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;

  // Upload to Cloudflare R2
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
    })
  );

  // Return the public URL so the database can save it
  return `${process.env.R2_PUBLIC_URL}/${filename}`;
}
