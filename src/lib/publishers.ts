import { TwitterApi } from "twitter-api-v2";

export async function publishToFacebook(content: string, pageAccessToken: string) {
  // A Page Access Token acts as the Page itself, so we can use the /me endpoint
  const url = `https://graph.facebook.com/v19.0/me/feed`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: content,
      access_token: pageAccessToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Facebook API Error:", data);
    throw new Error(data.error?.message || "Failed to post to Facebook");
  }

  return data;
}

export async function publishToTwitter(
  content: string,
  credentials: {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
  }
) {
  const client = new TwitterApi(credentials);
  const rwClient = client.readWrite;
  
  try {
    const tweet = await rwClient.v2.tweet(content);
    return tweet;
  } catch (error: any) {
    console.error("Twitter API Error:", error);
    throw new Error(error.message || "Failed to post to Twitter");
  }
}
