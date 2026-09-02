import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Missing LinkedIn OAuth config" }, { status: 500 });
  }

  const scopes = ["r_liteprofile", "w_member_social", "w_organization_social"].join(" ");
  // In production, generate a secure random state and store it in cookies/session for verification
  const state = "secure_random_state_string";

  const searchParams = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    scope: scopes,
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${searchParams.toString()}`;
  return NextResponse.redirect(authUrl);
}
