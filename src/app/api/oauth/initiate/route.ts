import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";

const PLATFORM_CONFIGS: Record<string, {
  buildAuthUrl: (clientId: string, redirectUri: string, state: string) => string;
  clientIdEnv?: string;
  redirectUriEnv?: string;
  isCustomApp?: boolean;
}> = {
  linkedin: {
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    redirectUriEnv: "LINKEDIN_REDIRECT_URI",
    buildAuthUrl: (clientId, redirectUri, state) => {
      const scopes = ["openid", "profile", "email", "w_member_social"].join(" ");
      return "https://www.linkedin.com/oauth/v2/authorization?" + new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        scope: scopes,
      }).toString();
    },
  },
  pinterest: {
    isCustomApp: true,
    buildAuthUrl: (clientId, redirectUri, state) => {
      const scopes = ["boards:read", "boards:write", "pins:read", "pins:write"].join(",");
      return "https://www.pinterest.com/oauth/?" + new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scopes,
        state,
      }).toString();
    },
  }
};

export async function POST(req: Request) {
  try {
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
    const body = await req.json().catch(() => ({}));
    const platform = (body.platform || "linkedin").toLowerCase();
    const appRecordId = body.appRecordId;

    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      return NextResponse.json({ error: "Unsupported platform: " + platform }, { status: 400 });
    }

    let clientId: string;
    let redirectUri: string;

    if (config.isCustomApp) {
      if (!appRecordId) return NextResponse.json({ error: "Missing appRecordId" }, { status: 400 });
      const appDoc = await adminDb.collection("social_apps").doc(appRecordId).get();
      if (!appDoc.exists || appDoc.data()?.userId !== userId || appDoc.data()?.platform !== platform) {
        return NextResponse.json({ error: "Forbidden: invalid app record" }, { status: 403 });
      }
      clientId = appDoc.data()!.appId;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      redirectUri = appUrl + "/api/oauth/callback";
    } else {
      clientId = process.env[config.clientIdEnv!] || "";
      redirectUri = process.env[config.redirectUriEnv!] || "";
      if (!clientId || !redirectUri) return NextResponse.json({ error: "Missing config" }, { status: 500 });
    }

    const state = crypto.randomBytes(32).toString("hex");

    await adminDb.collection("oauth_states").doc(state).set({
      userId,
      platform,
      appRecordId: config.isCustomApp ? appRecordId : null,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const authUrl = config.buildAuthUrl(clientId, redirectUri, state);
    return NextResponse.json({ authUrl });

  } catch (err: any) {
    console.error("[oauth/initiate] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}