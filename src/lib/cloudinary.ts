// src/lib/cloudinary.ts
// Cloudinary utility — server-side config and signed-upload helper

import { v2 as cloudinary } from "cloudinary";

// Configure with env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  created_at: string;
  folder: string;
};

// ─────────────────────────────────────────────
// Helper: Generate signed upload params (for client-side upload)
// ─────────────────────────────────────────────
export function generateSignedUploadParams(folder = "social_media") {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp,
    folder,
    allowed_formats: "jpg,jpeg,png,gif,webp,mp4,mov,avi",
    max_file_size: 10 * 1024 * 1024, // 10MB
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    ...params,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  };
}

// ─────────────────────────────────────────────
// Helper: Delete a file from Cloudinary
// ─────────────────────────────────────────────
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

// ─────────────────────────────────────────────
// Helper: Fetch all files in a folder (media library)
// ─────────────────────────────────────────────
export async function getMediaLibrary(folder = "social_media") {
  const result = await cloudinary.search
    .expression(`folder:${folder}`)
    .sort_by("created_at", "desc")
    .max_results(50)
    .with_field("tags")
    .execute();
  return result.resources as CloudinaryUploadResult[];
}

// ─────────────────────────────────────────────
// Helper: Generate optimized image URL
// ─────────────────────────────────────────────
export function getOptimizedUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: "auto" | number;
    format?: "auto" | "webp" | "jpg" | "png";
    crop?: "fill" | "scale" | "thumb" | "fit";
  }
) {
  return cloudinary.url(publicId, {
    width: options?.width,
    height: options?.height,
    quality: options?.quality ?? "auto",
    fetch_format: options?.format ?? "auto",
    crop: options?.crop ?? "fill",
    secure: true,
  });
}
