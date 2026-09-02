/**
 * POST /api/oauth/initiate
 * Called by the frontend (with Firebase ID token in Authorization header).
 * Validates the user, generates a secure state, stores it in Firestore,
 * then returns the platform OAuth authorization URL.
 *
 * Supports: linkedin (extensible to facebook, instagram, twitter, etc.)
 */

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";

// ── Supported platforms ──────────────────────────────────────────────────────

const PLATFORM_CONFIGS: Record<string, {
  buildAuthUrl: (clientId: string, redirectUri: string, state: string) => string;
  clientIdEnv: string;
  redirectUriEnv: string;
}> = {
  linkedin: {
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    redirectUriEnv: "LINKEDIN_REDIRECT_URI",
    buildAuthUrl: (clientId, redirectUri, state) => {
      const scopes = ["openid", "profile", "email", "w_member_social"].join(" ");
      return `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        scope: scopes,
      })}`;
    },
  },
  // Add more platforms here later, e.g. facebook, instagram, twitter
};

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // 1. Verify Firebase auth token from Authorization header
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.replace("Bearer ", "").trim();
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized: no token" }, { status: 401 });
    }

    let decodedToken: { uid: string };
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // 2. Determine platform from request body
    const body = await req.json().catch(() => ({}));
    const platform = (body.platform || "linkedin").toLowerCase();

    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 });
    }

    const clientId = process.env[config.clientIdEnv];
    const redirectUri = process.env[config.redirectUriEnv];

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: `${platform} OAuth credentials not configured on server` }, { status: 500 });
    }

    // 3. Generate a cryptographically secure state token
    const state = crypto.randomBytes(32).toString("hex");

    // 4. Store state in Firestore with expiry (10 min) — server-side only, never exposed to client
    await adminDb.collection("oauth_states").doc(state).set({
      userId,
      platform,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes from now
    });

    // 5. Build and return the authorization URL
    const authUrl = config.buildAuthUrl(clientId, redirectUri, state);
    return NextResponse.json({ authUrl });

  } catch (err: any) {
    console.error("[oauth/initiate] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
