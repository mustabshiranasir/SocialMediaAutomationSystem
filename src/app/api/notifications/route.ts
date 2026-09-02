// src/app/api/notifications/route.ts
// POST /api/notifications — Create a new in-app notification
// GET  /api/notifications — List notifications for a user (for server-side use)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, message, type = "info", link } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "userId, title, and message are required" }, { status: 400 });
    }

    const validTypes = ["info", "success", "warning", "error"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be info, success, warning, or error" }, { status: 400 });
    }

    const notifRef = db.collection("notifications");
    const doc = await notifRef.add({
      userId,
      title,
      message,
      type,
      link: link || null,
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: doc.id });
  } catch (error: any) {
    console.error("Notification create error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create notification" }, { status: 500 });
  }
}
