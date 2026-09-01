import { NextResponse } from "next/server";
import { addChannel } from "@/lib/firestore";

export async function POST(req: Request) {
  try {
    const { userId, authToken, ct0 } = await req.json();

    if (!authToken || !ct0) {
      return NextResponse.json(
        { error: "Both 'auth_token' and 'ct0' cookies are required." },
        { status: 400 }
      );
    }

    const cookieHeader = `auth_token=${authToken.trim()}; ct0=${ct0.trim()};`;
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    // Validate cookies against Twitter API endpoint
    let accountName = "Twitter Account";
    let accountId = `tw_${Date.now()}`;
    let profilePicUrl = "";

    try {
      const verifyRes = await fetch(
        "https://api.twitter.com/1.1/account/verify_credentials.json",
        {
          headers: {
            Cookie: cookieHeader,
            "x-csrf-token": ct0.trim(),
            "User-Agent": userAgent,
            Authorization:
              "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
          },
        }
      );

      if (verifyRes.ok) {
        const twUser = await verifyRes.json();
        if (twUser?.screen_name) {
          accountName = `@${twUser.screen_name}`;
          accountId = twUser.id_str || accountId;
          profilePicUrl = twUser.profile_image_url_https || "";
        }
      }
    } catch (err) {
      console.warn("[TwitterCookieValidation] Web verify fallback:", err);
    }

    // Save Twitter channel in Firestore
    const channelId = await addChannel({
      userId: userId || "demo",
      name: accountName,
      network: "twitter",
      channelType: "account",
      method: "cookie",
      isAutoShare: true,
      status: "connected",
      accountId,
      profilePicUrl,
      cookieAuthToken: authToken.trim(),
      cookieCt0: ct0.trim(),
    });

    return NextResponse.json({
      success: true,
      channelId,
      name: accountName,
      message: `Twitter account ${accountName} connected successfully via Cookie method!`,
    });
  } catch (err: any) {
    console.error("[TwitterCookieRoute Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process Twitter cookie connection." },
      { status: 500 }
    );
  }
}
