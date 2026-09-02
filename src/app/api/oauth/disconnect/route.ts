/**
 * DELETE /api/oauth/disconnect
 * Disconnects (deletes) a social channel for the authenticated user.
 * Verifies ownership before deleting — users can never delete each other's channels.
 */

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function DELETE(req: Request) {
  try {
    // 1. Verify Firebase auth
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.replace("Bearer ", "").trim();
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      userId = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 });
    }

    // 2. Get channel ID from request body
    const { channelId } = await req.json().catch(() => ({ channelId: null }));
    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    // 3. Verify the channel belongs to this user (security check)
    const channelRef = adminDb.collection("channels").doc(channelId);
    const channelDoc = await channelRef.get();

    if (!channelDoc.exists) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channelDoc.data()!.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: channel does not belong to you" }, { status: 403 });
    }

    // 4. Delete the channel
    await channelRef.delete();

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[oauth/disconnect] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
