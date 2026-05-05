import { v2 as cloudinary } from "cloudinary";

let configured = false;

function configure() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function getCloudinaryFolder(): string {
  return process.env.CLOUDINARY_UPLOAD_FOLDER || "bay-harbor-boats";
}

// Returns the params needed for an authenticated direct-from-browser upload.
// Browser POSTs the file + these params to https://api.cloudinary.com/v1_1/<cloud>/image/upload.
export function getSignedUpload(): {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
} {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET.");
  }
  configure();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = getCloudinaryFolder();
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    process.env.CLOUDINARY_API_SECRET as string
  );
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    timestamp,
    folder,
    signature,
  };
}
