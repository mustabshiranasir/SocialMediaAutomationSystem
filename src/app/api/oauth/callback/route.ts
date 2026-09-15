import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// ── Error codes — never put raw exception messages or provider responses in redirects ──

/** Log a server-side diagnostic. Never log tokens, secrets, or response bodies. */
function logError(label: string, context: string, statusCode?: number): void {
  // Only log the safe label and an optional HTTP status; never the full error or provider body.
  console.error("[oauth/callback]", label, context, statusCode != null ? "status=" + statusCode : "");
}

// ── LinkedIn-specific helpers ────────────────────────────────────────────────

async function exchangeLinkedInCode(code: string, redirectUri: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    logError("LinkedIn token exchange failed", "linkedin", res.status);
    throw new OAuthStepError("token_exchange", "linkedin");
  }
  return res.json();
}

async function fetchLinkedInProfile(accessToken: string): Promise<{
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  email?: string;
}> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: "Bearer " + accessToken },
  });
  if (!res.ok) {
    logError("LinkedIn profile fetch failed", "linkedin", res.status);
    throw new OAuthStepError("profile_fetch", "linkedin");
  }
  return res.json();
}

// ── Pinterest-specific helpers ───────────────────────────────────────────────

async function exchangePinterestCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}> {
  const authHeader = "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64");
  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": authHeader,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    logError("Pinterest token exchange failed", "pinterest", res.status);
    throw new OAuthStepError("token_exchange", "pinterest");
  }
  return res.json();
}

async function fetchPinterestProfile(accessToken: string): Promise<{
  account_type: string;
  profile_image: string;
  website_url: string;
  username: string;
}> {
  const res = await fetch("https://api.pinterest.com/v5/user_account", {
    headers: { Authorization: "Bearer " + accessToken },
  });
  if (!res.ok) {
    logError("Pinterest profile fetch failed", "pinterest", res.status);
    throw new OAuthStepError("profile_fetch", "pinterest");
  }
  return res.json();
}

// ── Typed error for safe step identification without leaking details ──────────

class OAuthStepError extends Error {
  constructor(public readonly step: string, public readonly platform: string) {
    super("oauth_step_failed");
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const channelsUrl = appUrl + "/social-poster?tab=Channels";

  try {
    const { searchParams } = new URL(req.url);
    const code  = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Provider denied / user cancelled — log the provider code server-side, redirect generically.
    if (error) {
      logError("Provider denied authorization", "provider_denied");
      return NextResponse.redirect(channelsUrl + "&error=oauth_denied");
    }

    if (!code || !state) {
      return NextResponse.redirect(channelsUrl + "&error=invalid_request");
    }

    // 1. Validate state from Firestore
    const stateRef = adminDb.collection("oauth_states").doc(state);
    const stateDoc = await stateRef.get();

    if (!stateDoc.exists) {
      return NextResponse.redirect(channelsUrl + "&error=invalid_state");
    }

    const { userId, platform, expiresAt, appRecordId } = stateDoc.data()!;

    if (Date.now() > expiresAt) {
      await stateRef.delete();
      return NextResponse.redirect(channelsUrl + "&error=session_expired");
    }

    // Consume the state (one-time use)
    await stateRef.delete();

    if (platform === "linkedin") {
      const redirectUri = process.env.LINKEDIN_REDIRECT_URI!;
      const tokenData = await exchangeLinkedInCode(code, redirectUri);
      const accessToken = tokenData.access_token;
      const tokenExpiry = Date.now() + tokenData.expires_in * 1000;
      const profile = await fetchLinkedInProfile(accessToken);

      const platformAccountId = "urn:li:person:" + profile.sub;
      const displayName = profile.name || (profile.given_name + " " + profile.family_name).trim() || "LinkedIn User";
      const docId = userId + "_linkedin_" + profile.sub;
      const channelRef = adminDb.collection("channels").doc(docId);
      const existingDoc = await channelRef.get();

      await channelRef.set({
        userId,
        network: "li",
        platform: "linkedin",
        channelType: "linkedin_profile",
        method: "app",
        name: displayName,
        accountId: platformAccountId,
        platformAccountId: profile.sub,
        profilePicUrl: profile.picture || "",
        email: profile.email || "",
        accessToken,
        tokenExpiry,
        isAutoShare: false,
        status: "connected",
        updatedAt: FieldValue.serverTimestamp(),
        ...(existingDoc.exists ? {} : {
          createdAt: FieldValue.serverTimestamp(),
          connectedAt: FieldValue.serverTimestamp(),
        }),
      }, { merge: true });

      return NextResponse.redirect(channelsUrl + "&connected=linkedin");

    } else if (platform === "pinterest") {
      if (!appRecordId) {
        logError("Missing appRecordId in state", "pinterest");
        return NextResponse.redirect(channelsUrl + "&error=oauth_failed");
      }

      // Re-verify ownership of the app record in the callback
      const appDoc = await adminDb.collection("social_apps").doc(appRecordId).get();
      if (!appDoc.exists || appDoc.data()?.userId !== userId) {
        logError("App record ownership check failed", "pinterest");
        return NextResponse.redirect(channelsUrl + "&error=oauth_failed");
      }

      const clientId = appDoc.data()!.appId;
      const clientSecret = appDoc.data()!.appSecret;
      if (!clientId || !clientSecret) {
        logError("App record missing credentials", "pinterest");
        return NextResponse.redirect(channelsUrl + "&error=oauth_failed");
      }

      const redirectUri = appUrl + "/api/oauth/callback";
      const tokenData = await exchangePinterestCode(code, clientId, clientSecret, redirectUri);
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token || null;

      const profile = await fetchPinterestProfile(accessToken);
      const platformAccountId = profile.username;
      const displayName = profile.username || "Pinterest User";

      const docId = userId + "_pinterest_" + platformAccountId;
      const channelRef = adminDb.collection("channels").doc(docId);
      const existingDoc = await channelRef.get();

      await channelRef.set({
        userId,
        network: "pinterest",
        platform: "pinterest",
        channelType: "pinterest_profile",
        method: "app",
        name: displayName,
        accountId: platformAccountId,
        platformAccountId,
        profilePicUrl: profile.profile_image || "",
        accessToken,
        refreshToken,
        isAutoShare: false,
        status: "connected",
        updatedAt: FieldValue.serverTimestamp(),
        ...(existingDoc.exists ? {} : {
          createdAt: FieldValue.serverTimestamp(),
          connectedAt: FieldValue.serverTimestamp(),
        }),
      }, { merge: true });

      return NextResponse.redirect(channelsUrl + "&connected=pinterest");

    } else {
      logError("Unsupported platform in state", "unsupported_platform");
      return NextResponse.redirect(channelsUrl + "&error=oauth_failed");
    }

  } catch (err: any) {
    // Log only the safe step identifier (never err.message, which may contain provider response bodies)
    if (err instanceof OAuthStepError) {
      logError("OAuth step failed", err.step + "/" + err.platform);
    } else {
      logError("Unexpected error", "unknown");
    }
    return NextResponse.redirect(channelsUrl + "&error=oauth_failed");
  }
}