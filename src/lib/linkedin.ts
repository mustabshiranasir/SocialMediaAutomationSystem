import { Channel, PostData } from "@/types/linkedin";

export async function publishToLinkedIn(channel: Channel, post: PostData) {
  // 1. Check for token expiry (Requirement 4)
  if (Date.now() > channel.tokenExpiry) {
    throw new Error("LinkedIn access token has expired. Please re-authenticate.");
  }

  // 2. Build UGC Post payload
  const isArticle = !!post.link || !!post.imageUrl;
  
  // Note: To post native raw images via UGC, you must implement the 3-step asset upload process 
  // (registerUpload -> PUT image bytes -> post asset URN). 
  // To keep it clean and within a single request, we use the "ARTICLE" share media category 
  // which accepts standard URLs for both links and thumbnails.
  const payload = {
    author: channel.accountId,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: post.text,
        },
        shareMediaCategory: isArticle ? "ARTICLE" : "NONE",
        media: isArticle
          ? [
              {
                status: "READY",
                ...(post.link && { originalUrl: post.link }),
                ...(post.imageUrl && {
                  thumbnails: [{ url: post.imageUrl }],
                }),
              },
            ]
          : [],
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  // 3. Post to LinkedIn UGC API
  const fetchOptions: any = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channel.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(payload),
  };

  if (channel.proxy) {
    // Requires undici to be available in the environment (Next.js provides this via Node 18+)
    const { ProxyAgent } = require("undici");
    fetchOptions.dispatcher = new ProxyAgent(channel.proxy);
  }

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(`LinkedIn post failed: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}
