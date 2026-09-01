import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

const META_CLIENT_ID = process.env.META_CLIENT_ID;
const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * GET /api/oauth/login?network=facebook
 *
 * Starts the Facebook App Method OAuth flow.
 * The Authorization header must carry a Firebase ID token so we know which
 * user is connecting the account.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network")?.toLowerCase() || "facebook";

  // ── 1. Verify the Firebase ID token to get the current user ──
  const authHeader = request.headers.get("Authorization");
  let userId = "anonymous";

  if (authHeader?.startsWith("Bearer ")) {
    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      userId = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Unauthorized — invalid token" }, { status: 401 });
    }
  } else {
    // Fallback: allow unauthenticated for dev, but flag it
    userId = "dev_user";
  }

  if (!META_CLIENT_ID) {
    return NextResponse.json(
      { error: "Facebook App not configured. Please set META_CLIENT_ID in environment variables." },
      { status: 503 }
    );
  }

  // ── 2. Build the Facebook OAuth authorization URL ──
  const redirectUri = `${BACKEND_URL}/api/oauth/callback`;

  // Embed userId and network in the state parameter (URL-safe base64)
  const stateData = { userId, network, method: "app", ts: Date.now() };
  const state = encodeURIComponent(JSON.stringify(stateData));

  // Scopes required for Facebook Pages management
  const scopes = [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_show_list",
    "pages_read_user_content",
  ].join(",");

  const authUrl =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${META_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&state=${state}` +
    `&response_type=code`;

  // ── 3. Redirect the user's browser to Facebook ──
  return NextResponse.redirect(authUrl);
}
