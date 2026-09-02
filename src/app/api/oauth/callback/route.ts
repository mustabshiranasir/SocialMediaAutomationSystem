/**
 * GET /api/oauth/callback
 * LinkedIn (and other platforms) redirect here after user grants permission.
 *
 * Flow:
 * 1. Validate state against Firestore oauth_states (prevents CSRF)
 * 2. Exchange authorization code for access token (server-side only, secret never exposed)
 * 3. Fetch user profile from the platform API
 * 4. Upsert Channel document in Firestore (update if exists, create if not — no duplicates)
 * 5. Redirect back to /social-poster?tab=Channels&connected=<platform>
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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
    const err = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${err}`);
  }
  return res.json();
}

async function fetchLinkedInProfile(accessToken: string): Promise<{
  sub: string;         // OpenID Connect subject (LinkedIn member ID)
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  email?: string;
}> {
  // Using OpenID Connect userinfo endpoint (works with openid + profile + email scopes)
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn profile fetch failed: ${err}`);
  }
  return res.json();
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const channelsUrl = `${appUrl}/social-poster?tab=Channels`;

  try {
    const { searchParams } = new URL(req.url);
    const code  = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // LinkedIn denied / user cancelled
    if (error) {
      return NextResponse.redirect(`${channelsUrl}&error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${channelsUrl}&error=${encodeURIComponent("Missing code or state")}`);
    }

    // 1. Validate state from Firestore
    const stateRef = adminDb.collection("oauth_states").doc(state);
    const stateDoc = await stateRef.get();

    if (!stateDoc.exists) {
      return NextResponse.redirect(`${channelsUrl}&error=${encodeURIComponent("Invalid or expired state. Please try again.")}`);
    }

    const { userId, platform, expiresAt } = stateDoc.data()!;

    if (Date.now() > expiresAt) {
      await stateRef.delete(); // Clean up expired state
      return NextResponse.redirect(`${channelsUrl}&error=${encodeURIComponent("OAuth session expired. Please try again.")}`);
    }

    // Consume the state (one-time use)
    await stateRef.delete();

    if (platform !== "linkedin") {
      return NextResponse.redirect(`${channelsUrl}&error=${encodeURIComponent(`Unsupported platform: ${platform}`)}`);
    }

    const redirectUri = process.env.LINKEDIN_REDIRECT_URI!;

    // 2. Exchange code for token (entirely server-side)
    const tokenData = await exchangeLinkedInCode(code, redirectUri);
    const accessToken = tokenData.access_token;
    const tokenExpiry = Date.now() + tokenData.expires_in * 1000;

    // 3. Fetch LinkedIn profile
    const profile = await fetchLinkedInProfile(accessToken);
    const platformAccountId = `urn:li:person:${profile.sub}`;
    const displayName = profile.name || `${profile.given_name} ${profile.family_name}`.trim() || "LinkedIn User";

    // 4. Upsert Channel in Firestore
    // Document ID is deterministic: userId_platform_platformAccountId — prevents duplicates
    const docId = `${userId}_linkedin_${profile.sub}`;
    const channelRef = adminDb.collection("channels").doc(docId);
    const existingDoc = await channelRef.get();

    const channelData = {
      userId,
      network: "li",                     // matches networkOptionsAddModal id
      platform: "linkedin",
      channelType: "linkedin_profile",
      method: "app",
      name: displayName,
      accountId: platformAccountId,
      platformAccountId: profile.sub,
      profilePicUrl: profile.picture || "",
      email: profile.email || "",
      accessToken,                       // stored server-side, never sent to client directly
      tokenExpiry,
      isAutoShare: false,
      status: "connected",
      updatedAt: FieldValue.serverTimestamp(),
      ...(existingDoc.exists ? {} : {    // only set createdAt on first creation
        createdAt: FieldValue.serverTimestamp(),
        connectedAt: FieldValue.serverTimestamp(),
      }),
    };

    await channelRef.set(channelData, { merge: true });

    // 5. Redirect back to the Channels tab with success signal
    return NextResponse.redirect(`${channelsUrl}&connected=linkedin`);

  } catch (err: any) {
    console.error("[oauth/callback] Error:", err);
    return NextResponse.redirect(`${channelsUrl}&error=${encodeURIComponent(err.message || "OAuth failed")}`);
  }
}
