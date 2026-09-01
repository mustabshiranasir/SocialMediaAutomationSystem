import { NextResponse } from "next/server";
import { addChannel } from "@/lib/firestore";

const META_CLIENT_ID = process.env.META_CLIENT_ID;
const META_CLIENT_SECRET = process.env.META_CLIENT_SECRET;
const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * GET /api/oauth/callback?code=...&state=...
 *
 * Handles Facebook App Method OAuth callback.
 * 1. Exchanges authorization code → user access token
 * 2. Fetches all Pages the user manages (with page-level tokens)
 * 3. Saves each Page as a separate Channel document in Firestore
 * 4. Redirects back to the Channels tab
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateStr = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // ── Handle user cancellation or error ──
  if (error || !code) {
    const errorMsg = errorDescription || error || "AuthenticationFailed";
    return NextResponse.redirect(
      `${BACKEND_URL}/social-poster?tab=Channels&error=${encodeURIComponent(errorMsg)}`
    );
  }

  // ── Parse state to get userId and network ──
  let userId = "anonymous";
  let network = "facebook";

  try {
    if (stateStr) {
      const parsed = JSON.parse(decodeURIComponent(stateStr));
      userId = parsed.userId || "anonymous";
      network = parsed.network || "facebook";
    }
  } catch {
    console.error("Failed to parse OAuth state");
  }

  const redirectUri = `${BACKEND_URL}/api/oauth/callback`;

  try {
    // ── Step 1: Exchange code for user access token ──
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", META_CLIENT_ID || "");
    tokenUrl.searchParams.set("client_secret", META_CLIENT_SECRET || "");
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Facebook token exchange failed:", tokenData);
      throw new Error("TokenExchangeFailed");
    }

    const userAccessToken: string = tokenData.access_token;

    // ── Step 2: Fetch the user's own profile ──
    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,picture.type(large)&access_token=${userAccessToken}`
    );
    const profile = await profileRes.json();

    // ── Step 3: Fetch ALL Pages this user manages ──
    // /me/accounts returns pages with their individual page-level access tokens
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture.type(large),fan_count&access_token=${userAccessToken}`
    );
    const pagesData = await pagesRes.json();
    const pages: any[] = pagesData.data || [];

    let channelCount = 0;

    // ── Step 4: Save each Page as a Channel document ──
    const savePromises = pages.map(async (page: any) => {
      // Each page has its own `access_token` — this is the Page Access Token
      // This is different from the user token and is required to post to a Page feed
      await addChannel({
        userId,
        name: page.name,
        network: "facebook",
        channelType: "ownpage",
        method: "app",
        isAutoShare: false,
        status: "connected",
        accountId: page.id,
        pageId: page.id,
        accessToken: page.access_token,          // Page-level token (not user token!)
        profilePicUrl: page.picture?.data?.url || null,
        scopes: ["pages_manage_posts", "pages_read_engagement"],
        tokenExpiry: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
      });
      channelCount++;
    });

    await Promise.all(savePromises);

    // ── Step 5: Redirect back to the app with success ──
    return NextResponse.redirect(
      `${BACKEND_URL}/social-poster?tab=Channels&success=true&count=${channelCount}&account=${encodeURIComponent(profile.name || "")}`
    );
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${BACKEND_URL}/social-poster?tab=Channels&error=${encodeURIComponent(err.message || "UnknownError")}`
    );
  }
}
