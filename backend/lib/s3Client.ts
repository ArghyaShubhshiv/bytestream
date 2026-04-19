import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION ?? "us-east-1";

export const s3Client = new S3Client({
  region,
  credentials:
    process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY,
          secretAccessKey: process.env.AWS_SECRET_KEY,
        }
      : undefined, // falls back to env/instance role if undefined
});
