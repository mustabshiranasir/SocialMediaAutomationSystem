import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { publishToFacebookChannel } from "@/lib/facebook-publisher";
import { publishToTwitterChannel } from "@/lib/twitter-publisher";
import { publishToPinterestChannel } from "@/lib/pinterest-publisher";
import { Channel } from "@/lib/firestore";

/**
 * POST /api/schedule
 * Body: { content, channels: Channel[], channelIds?: string[], scheduledAt?, mediaUrls?, linkUrl?, isShareNow? }
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ") || authHeader.split("Bearer ")[1] === "null") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    let userEmail: string;

    const idToken = authHeader.split("Bearer ")[1].trim();
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      userId = decodedToken.uid;
      userEmail = decodedToken.email || "user@demo.com";
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 });
    }

    const { content, channels, channelIds, scheduledAt, mediaUrls, linkUrl, isShareNow } = await req.json();

    let idsToFetch: string[] = [];
    if (channelIds && channelIds.length) {
      idsToFetch = channelIds;
    } else if (channels && channels.length) {
      idsToFetch = channels.map((c: any) => c.id).filter(Boolean);
    }

    if (!content || !idsToFetch.length) {
      return NextResponse.json(
        { error: "Content and at least one channel selection are required." },
        { status: 400 }
      );
    }

    const fetchedSnap = await adminDb
      .collection("channels")
      .where("__name__", "in", idsToFetch)
      .get();
      
    if (fetchedSnap.docs.length !== idsToFetch.length) {
      return NextResponse.json({ error: "Forbidden: one or more channels do not exist or do not belong to you" }, { status: 403 });
    }

    const targetChannels = fetchedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));

    for (const channel of targetChannels) {
      if (channel.userId !== userId) {
        return NextResponse.json({ error: "Forbidden: one or more channels do not exist or do not belong to you" }, { status: 403 });
      }
    }

    const networks = Array.from(new Set(targetChannels.map(c => c.network)));
    let finalStatus = isShareNow ? "published" : "scheduled";
    const publishResults: Record<string, any>[] = [];

    // ── Immediate Publishing (isShareNow) ──
    if (isShareNow) {
      let anyFailed = false;

      for (const channel of targetChannels) {
        if (channel.network === "facebook") {
          const res = await publishToFacebookChannel(channel, content, mediaUrls, linkUrl);
          publishResults.push({ channelId: channel.id, name: channel.name, type: channel.channelType, ...res });
          if (!res.success) anyFailed = true;
        } else if (channel.network === "twitter" || channel.network === "x") {
          const res = await publishToTwitterChannel(channel, content, mediaUrls, linkUrl);
          publishResults.push({ channelId: channel.id, name: channel.name, type: channel.channelType, ...res });
          if (!res.success) anyFailed = true;
        } else if (channel.network === "pinterest") {
          const res = await publishToPinterestChannel(channel, content, mediaUrls, linkUrl);
          publishResults.push({ channelId: channel.id, name: channel.name, type: channel.channelType, ...res });
          if (!res.success) anyFailed = true;
        } else {
          // Other networks fallback mock publish
          publishResults.push({ channelId: channel.id, name: channel.name, success: true, postId: `mock_${Date.now()}` });
        }
      }

      if (anyFailed) finalStatus = "failed";
    }

    // ── Save Post to Firestore ──
    const newPostRef = await adminDb.collection("posts").add({
      content,
      networks,
      channelIds: targetChannels.map(c => c.id).filter(Boolean),
      authorId: userId,
      authorEmail: userEmail,
      status: finalStatus,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      mediaUrls: mediaUrls || [],
      linkUrl: linkUrl || null,
      publishResults: publishResults.length ? publishResults : null,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      postId: newPostRef.id,
      status: finalStatus,
      publishResults,
    });
  } catch (error: any) {
    console.error("Scheduling error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
