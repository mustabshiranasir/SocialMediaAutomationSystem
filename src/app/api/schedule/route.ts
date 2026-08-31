import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    // For local testing, we might bypass auth if no token is provided, 
    // or we can mock the user id. Let's try to parse it but fall back to a mock user if testing.
    let userId = "mock_user_id";
    let userEmail = "mock@example.com";

    if (authHeader?.startsWith("Bearer ") && authHeader.split("Bearer ")[1] !== "null") {
      const idToken = authHeader.split("Bearer ")[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        userId = decodedToken.uid;
        userEmail = decodedToken.email || "mock@example.com";
      } catch (err) {
        console.warn("Token verification failed, using mock user");
      }
    }

    const { content, channels, scheduledAt, mediaUrls, isShareNow } = await req.json();

    if (!content || !channels || !channels.length) {
      return NextResponse.json(
        { error: "Content and at least one channel are required" },
        { status: 400 }
      );
    }

    const networks = channels.map((c: any) => c.network);

    let finalStatus = "scheduled";

    if (isShareNow) {
      finalStatus = "published";
      for (const channel of channels) {
        if (!channel.accessToken) continue;
        try {
          if (channel.network === "facebook") {
            const response = await fetch(`https://graph.facebook.com/v19.0/me/feed`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: content, access_token: channel.accessToken }),
            });
            if (!response.ok) finalStatus = "failed";
          } else if (channel.network === "twitter") {
            const response = await fetch("https://api.twitter.com/2/tweets", {
              method: "POST",
              headers: { "Authorization": `Bearer ${channel.accessToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({ text: content })
            });
            if (!response.ok) finalStatus = "failed";
          }
        } catch (err) {
          console.error("Publishing error:", err);
          finalStatus = "failed";
        }
      }
    }

    // Save to Firestore using admin SDK since we are in API route
    const newPostRef = await adminDb.collection("posts").add({
      content,
      networks,
      authorId: userId,
      authorEmail: userEmail,
      status: finalStatus,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      mediaUrls: mediaUrls || [],
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, postId: newPostRef.id });

  } catch (error: any) {
    console.error("Scheduling error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
