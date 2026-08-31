import { NextResponse } from "next/server";

const OAUTH_PROVIDERS: Record<string, any> = {
  facebook: {
    clientId: process.env.META_CLIENT_ID,
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    scope: "pages_manage_posts,pages_read_engagement",
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID,
    authUrl: "https://twitter.com/i/oauth2/authorize",
    scope: "tweet.read tweet.write users.read offline.access",
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    scope: "r_liteprofile w_member_social",
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network")?.toLowerCase();
  
  if (!network || !OAUTH_PROVIDERS[network]) {
    // If we don't have it configured, or it's a mock network without keys, fallback gracefully
    return NextResponse.redirect(new URL(`/social-poster?error=UnsupportedOrMissingNetwork`, request.url));
  }

  const provider = OAUTH_PROVIDERS[network];
  
  if (!provider.clientId) {
    return NextResponse.redirect(new URL(`/social-poster?error=MissingEnvironmentVariablesFor_${network}`, request.url));
  }

  // Generate a state parameter to prevent CSRF and pass state to callback
  const state = encodeURIComponent(JSON.stringify({ network, timestamp: Date.now() }));
  const redirectUri = `${new URL(request.url).origin}/api/oauth/callback`;

  let authUrl = "";
  if (network === "twitter") {
    authUrl = `${provider.authUrl}?response_type=code&client_id=${provider.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(provider.scope)}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
  } else {
    authUrl = `${provider.authUrl}?client_id=${provider.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(provider.scope)}&state=${state}`;
  }

  // Redirect the user to the actual social platform's OAuth login
  return NextResponse.redirect(authUrl);
}
