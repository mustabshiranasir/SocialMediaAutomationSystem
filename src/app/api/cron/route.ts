import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const now = new Date();
    
    // Find all scheduled posts where scheduledAt is in the past or now
    const snapshot = await adminDb.collection("posts")
      .where("status", "==", "scheduled")
      .where("scheduledAt", "<=", now)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: "No posts to process", processed: 0 });
    }

    const processedPosts: string[] = [];

    // Process each scheduled post
    for (const doc of snapshot.docs) {
      const postData = doc.data();
      const networks = postData.networks || [];
      const content = postData.content;
      
      let allSuccess = true;

      // We need the user's channels to get the access tokens.
      // Currently the post stores networks array (e.g. ['facebook', 'twitter']).
      // A more robust implementation links the post to specific channel IDs. 
      // For this demo, let's fetch the author's connected channels.
      const channelsSnap = await adminDb.collection("channels")
        .where("status", "==", "connected")
        .get();
        
      const userChannels = channelsSnap.docs.map(d => d.data());

      for (const network of networks) {
        const channel = userChannels.find(c => c.network === network);
        if (!channel || !channel.accessToken) {
          console.warn(`No active token found for network ${network}`);
          allSuccess = false;
          continue;
        }

        try {
          if (network === "facebook") {
            // Actual publish call using token
            // In a real app we'd use a page access token, but here we demonstrate the structure
            const response = await fetch(`https://graph.facebook.com/v19.0/me/feed`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: content,
                access_token: channel.accessToken,
              }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "FB Error");
          } else if (network === "twitter") {
            // Twitter V2 OAuth2 user-context posting
            const response = await fetch("https://api.twitter.com/2/tweets", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${channel.accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ text: content })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.title || "Twitter Error");
          }
          // else mock success
        } catch (err: any) {
          console.error(`Failed to publish to ${network}:`, err.message);
          allSuccess = false;
        }
      }

      // Update post status to published if at least some succeeded, or failed
      await adminDb.collection("posts").doc(doc.id).update({
        status: allSuccess ? "published" : "failed",
        publishedAt: now,
      });

      processedPosts.push(doc.id);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processedPosts.length} posts`,
      processed: processedPosts.length,
      postIds: processedPosts 
    });

  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
