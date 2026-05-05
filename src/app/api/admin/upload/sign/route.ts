import { NextResponse } from "next/server";
import { getSignedUpload, isCloudinaryConfigured } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Image uploads aren't configured. The site owner needs to set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Railway." },
      { status: 503 }
    );
  }
  try {
    const params = getSignedUpload();
    return NextResponse.json(params);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not sign upload" },
      { status: 500 }
    );
  }
}
