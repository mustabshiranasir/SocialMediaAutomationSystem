import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// GET /api/oauth/callback?code=xxx&state=base64({userId})
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/accounts?linkedin_error=${error || "missing_code"}`);
  }

  // 1. Decode state to get userId
  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    userId = decoded.userId;
    if (!userId) throw new Error("No userId in state");
  } catch {
    return NextResponse.redirect(`${appUrl}/accounts?linkedin_error=invalid_state`);
  }

  // 2. Load this user's LinkedIn app credentials from Firestore
  const settingsSnap = await adminDb
    .collection("users")
    .doc(userId)
    .collection("settings")
    .doc("linkedin_app")
    .get();

  if (!settingsSnap.exists) {
    return NextResponse.redirect(`${appUrl}/accounts?linkedin_error=no_credentials`);
  }

  const { clientId, clientSecret } = settingsSnap.data() as { clientId: string; clientSecret: string };
  const redirectUri = `${appUrl}/api/oauth/callback`;

  // 3. Exchange auth code for access token using the user's own app credentials
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/accounts?linkedin_error=token_exchange_failed`);
  }

  const tokenData = await tokenRes.json();
  const accessToken: string = tokenData.access_token;
  // LinkedIn tokens are valid for 60 days (3rd party) or up to 1 year (member)
  const tokenExpiry: number = Date.now() + tokenData.expires_in * 1000;

  // 4. Fetch the LinkedIn user profile
  const meRes = await fetch("https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!meRes.ok) {
    return NextResponse.redirect(`${appUrl}/accounts?linkedin_error=profile_fetch_failed`);
  }

  const meData = await meRes.json();
  const personUrn = `urn:li:person:${meData.id}`;
  const displayName = `${meData.localizedFirstName || ""} ${meData.localizedLastName || ""}`.trim() || "LinkedIn Profile";

  // Extract profile picture if available
  const profilePicUrl: string =
    meData.profilePicture?.["displayImage~"]?.elements?.slice(-1)?.[0]?.identifiers?.[0]?.identifier || "";

  // 5. Save the personal profile channel to Firestore
  const channelsRef = adminDb.collection("channels");

  await channelsRef.add({
    userId,
    name: displayName,
    network: "linkedin",
    channelType: "linkedin_profile",
    method: "app",
    accountId: personUrn,
    accessToken,
    tokenExpiry,
    profilePicUrl,
    isAutoShare: false,
    status: "connected",
    createdAt: FieldValue.serverTimestamp(),
  });

  // 6. Fetch and save LinkedIn Organization Pages the user manages
  const orgsRes = await fetch(
    "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&projection=(elements*(organization~(id,localizedName,logoV2(original~:playableStreams))))",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  if (orgsRes.ok) {
    const orgsData = await orgsRes.json();
    for (const element of orgsData.elements || []) {
      const org = element["organization~"];
      const orgUrn: string = element.organization; // e.g. urn:li:organization:123
      const orgName: string = org?.localizedName || "LinkedIn Page";
      const orgPic: string =
        org?.logoV2?.["original~"]?.elements?.[0]?.identifiers?.[0]?.identifier || "";

      await channelsRef.add({
        userId,
        name: orgName,
        network: "linkedin",
        channelType: "linkedin_page",
        method: "app",
        accountId: orgUrn,
        accessToken,
        tokenExpiry,
        profilePicUrl: orgPic,
        isAutoShare: false,
        status: "connected",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }

  // 7. Redirect back to accounts page with success flag
  return NextResponse.redirect(`${appUrl}/accounts?linkedin_success=true`);
}
