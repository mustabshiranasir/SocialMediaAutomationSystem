// src/app/api/upload/route.ts
// API Route: POST /api/upload
// Accepts a file via multipart/form-data, validates it, uploads to Cloudinary
// Returns: { url, public_id, format, bytes, width, height }

import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

// ─── Validation constants ───────────────────────────────────
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/avi",
  "video/x-msvideo",
];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// ─── POST /api/upload ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "social_media";

    // 1. File presence check
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // 2. File size validation (10MB max)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum allowed size is 10MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 413 }
      );
    }

    // 3. File type validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed. Allowed: JPEG, PNG, GIF, WEBP, MP4, MOV, AVI` },
        { status: 415 }
      );
    }

    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    // 4. Convert File to base64 for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // 5. Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: isVideo ? "video" : "image",
      // Image optimization settings
      quality: "auto",
      fetch_format: "auto",
      // Transformation: auto-optimize on delivery
      transformation: isVideo
        ? [{ quality: "auto" }]
        : [{ quality: "auto", fetch_format: "auto" }],
    });

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      duration: (result as any).duration,
      created_at: result.created_at,
      folder: result.folder,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
