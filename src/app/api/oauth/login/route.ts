import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET /api/oauth/login?userId=xxx
// Reads the user's LinkedIn app credentials from Firestore, then redirects to LinkedIn OAuth
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Load the user's LinkedIn app credentials from Firestore
  const settingsSnap = await adminDb
    .collection("users")
    .doc(userId)
    .collection("settings")
    .doc("linkedin_app")
    .get();

  if (!settingsSnap.exists) {
    return NextResponse.json(
      { error: "LinkedIn app credentials not found. Please enter your Client ID and Secret first." },
      { status: 404 }
    );
  }

  const { clientId } = settingsSnap.data() as { clientId: string; clientSecret: string };

  if (!clientId) {
    return NextResponse.json({ error: "LinkedIn Client ID is missing from saved credentials." }, { status: 400 });
  }

  // The redirect URI must match exactly what's registered in your LinkedIn Developer App
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/oauth/callback`;

  const scopes = ["r_liteprofile", "w_member_social", "w_organization_social"].join(" ");

  // Pass userId in state so the callback knows which user to save channels for
  const state = Buffer.from(JSON.stringify({ userId })).toString("base64");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: scopes,
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
