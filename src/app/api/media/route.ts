// src/app/api/media/route.ts
// GET  /api/media         — List all media files from Cloudinary
// DELETE /api/media       — Delete a specific media file
// PATCH /api/media        — Update media context (title, alt, caption, description)

import { NextRequest, NextResponse } from "next/server";
import cloudinary, { deleteFromCloudinary } from "@/lib/cloudinary";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "social_media";
    const type   = searchParams.get("type");

    // Fetch images and videos in parallel to drastically improve load speed
    const fetchImages = cloudinary.api.resources({
      type: "upload",
      prefix: `${folder}/`,
      max_results: 100,
      resource_type: "image",
      context: true,
    });

    let resources: any[] = [];

    if (!type || type === "all") {
      const fetchVideos = cloudinary.api.resources({
        type: "upload",
        prefix: `${folder}/`,
        max_results: 100,
        resource_type: "video",
        context: true,
      });

      const [imageResult, videoResult] = await Promise.all([fetchImages, fetchVideos]);
      resources = [...imageResult.resources, ...videoResult.resources];
      resources.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      const result = await (type === "video" ? cloudinary.api.resources({
        type: "upload", prefix: `${folder}/`, max_results: 100, resource_type: "video", context: true
      }) : fetchImages);
      resources = result.resources;
    }

    const files = resources.map((r: any) => ({
      public_id:     r.public_id,
      url:           r.secure_url,
      format:        r.format,
      resource_type: r.resource_type,
      bytes:         r.bytes,
      width:         r.width,
      height:        r.height,
      created_at:    r.created_at,
      context:       r.context?.custom || {},
    }));

    return NextResponse.json({ files, total: files.length });
  } catch (error: any) {
    console.error("Media list error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch media library" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { public_id, resource_type = "image" } = await req.json();
    if (!public_id) return NextResponse.json({ error: "public_id is required" }, { status: 400 });
    await deleteFromCloudinary(public_id, resource_type);
    return NextResponse.json({ success: true, deleted: public_id });
  } catch (error: any) {
    console.error("Media delete error:", error);
    return NextResponse.json({ error: error?.message || "Delete failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { public_id, resource_type = "image", context } = await req.json();
    if (!public_id || !context) {
      return NextResponse.json({ error: "public_id and context are required" }, { status: 400 });
    }

    // Convert object to context string format: "key1=val1|key2=val2"
    const contextString = Object.entries(context)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${String(v).replace(/\|/g, "").replace(/=/g, "")}`)
      .join("|");

    if (contextString) {
      await cloudinary.api.update(public_id, {
        resource_type,
        context: contextString
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Media update error:", error);
    return NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 });
  }
}
