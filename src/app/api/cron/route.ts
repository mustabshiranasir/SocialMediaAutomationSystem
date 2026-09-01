import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { publishToFacebookChannel } from "@/lib/facebook-publisher";
import { publishToTwitterChannel } from "@/lib/twitter-publisher";
import { Channel } from "@/lib/firestore";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron
 * Security: Requires Authorization header matching CRON_SECRET (if configured)
 *
 * Finds all posts where `status == "scheduled"` and `scheduledAt <= now`.
 * Publishes them across all target channels, user-scoped.
 */
export async function GET(req: Request) {
  try {
    // ── 1. Security Authorization Check ──
    if (CRON_SECRET) {
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : null;
      if (token !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized cron execution request." }, { status: 401 });
      }
    }

    const now = new Date();

    // ── 2. Query overdue scheduled posts ──
    const snapshot = await adminDb
      .collection("posts")
      .where("status", "==", "scheduled")
      .where("scheduledAt", "<=", now)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: "No scheduled posts to process.", processed: 0 });
    }

    const processedPosts: string[] = [];

    // ── 3. Process each post ──
    for (const doc of snapshot.docs) {
      const postData = doc.data();
      const content = postData.content;
      const mediaUrls = postData.mediaUrls || [];
      const linkUrl = postData.linkUrl;
      const authorId = postData.authorId;
      const targetChannelIds: string[] = postData.channelIds || [];

      let channelsToPublish: Channel[] = [];

      // Fetch specific channels bound to this post, or fallback to author's connected channels
      if (targetChannelIds.length > 0) {
        const chanSnap = await adminDb
          .collection("channels")
          .where("__name__", "in", targetChannelIds)
          .get();
        channelsToPublish = chanSnap.docs.map(d => ({ id: d.id, ...d.data() } as Channel));
      } else if (authorId) {
        const chanSnap = await adminDb
          .collection("channels")
          .where("userId", "==", authorId)
          .where("status", "==", "connected")
          .get();
        channelsToPublish = chanSnap.docs.map(d => ({ id: d.id, ...d.data() } as Channel));
      }

      let allSuccess = true;
      const executionLogs: Record<string, any>[] = [];

      for (const channel of channelsToPublish) {
        if (channel.network === "facebook") {
          const result = await publishToFacebookChannel(channel, content, mediaUrls, linkUrl);
          executionLogs.push({ channelId: channel.id, name: channel.name, type: channel.channelType, ...result });

          if (!result.success) {
            allSuccess = false;
            // Mark token expired if code 190
            if (result.error?.includes("Expired or Revoked")) {
              await adminDb.collection("channels").doc(channel.id!).update({ status: "error" });
            }
          }
        } else if (channel.network === "twitter" || channel.network === "x") {
          const result = await publishToTwitterChannel(channel, content, mediaUrls, linkUrl);
          executionLogs.push({ channelId: channel.id, name: channel.name, type: channel.channelType, ...result });
          if (!result.success) allSuccess = false;
        } else {
          // Fallback mock dispatch
          executionLogs.push({ channelId: channel.id, name: channel.name, success: true });
        }
      }

      // Update post status
      await adminDb
        .collection("posts")
        .doc(doc.id)
        .update({
          status: allSuccess ? "published" : "failed",
          publishedAt: now,
          cronExecutionLogs: executionLogs,
        });

      processedPosts.push(doc.id);
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedPosts.length} posts successfully.`,
      processed: processedPosts.length,
      postIds: processedPosts,
    });
  } catch (error: any) {
    console.error("Cron execution error:", error);
    return NextResponse.json(
      { error: "Cron worker internal error", details: error.message },
      { status: 500 }
    );
  }
}
