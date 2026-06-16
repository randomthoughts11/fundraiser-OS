import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client() {
  return new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });
}

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    return `local://${key}`;
  }

  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return `s3://${bucket}/${key}`;
}

export async function downloadFromS3(key: string): Promise<Buffer> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket || key.startsWith("local://")) {
    throw new Error("S3 not configured or local file");
  }

  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const bytes = await response.Body?.transformToByteArray();
  return Buffer.from(bytes ?? []);
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) return key;

  const client = getS3Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 3600 },
  );
}
