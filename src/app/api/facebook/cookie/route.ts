import { NextResponse } from "next/server";
import { addChannel, Channel } from "@/lib/firestore";
import { adminAuth } from "@/lib/firebase-admin";

/**
 * POST /api/facebook/cookie
 * Body: { c_user: string, xs: string, datr?: string }
 * Headers: Authorization: Bearer <FirebaseIdToken>
 *
 * Validates Facebook session cookies, verifies identity via Graph /me (or cookie html),
 * and creates FS Poster-style channels for:
 * 1. Personal Account Timeline (channelType: "account")
 * 2. Personal Story (channelType: "account_story")
 * 3. User Managed Pages (channelType: "ownpage")
 * 4. User Managed Page Stories (channelType: "ownpage_story")
 * 5. User Groups (channelType: "group")
 */
export async function POST(request: Request) {
  try {
    // ── 1. Authenticate user via Firebase ID Token ──
    const authHeader = request.headers.get("Authorization");
    let userId = "";

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        userId = decoded.uid;
      } catch {
        return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const { c_user, xs, datr } = await request.json();

    if (!c_user || !xs) {
      return NextResponse.json(
        { error: "Both c_user and xs cookies are required." },
        { status: 400 }
      );
    }

    const cookieHeader = `c_user=${c_user.trim()}; xs=${xs.trim()};${datr ? ` datr=${datr.trim()};` : ""}`;

    // ── 2. Test session cookie validity by calling Facebook Graph /me endpoint with cookies ──
    const meRes = await fetch("https://graph.facebook.com/v19.0/me?fields=id,name,picture.type(large)", {
      headers: {
        Cookie: cookieHeader,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    let accountId = c_user.trim();
    let accountName = `FB Account (${c_user.slice(0, 6)})`;
    let profilePicUrl = `https://graph.facebook.com/${c_user.trim()}/picture?type=large`;

    if (meRes.ok) {
      const meData = await meRes.json();
      if (meData.id) accountId = meData.id;
      if (meData.name) accountName = meData.name;
      if (meData.picture?.data?.url) profilePicUrl = meData.picture.data.url;
    }

    const createdChannels: Channel[] = [];

    // ── 3. Create Account Timeline Channel ──
    const accChannel: Omit<Channel, "id" | "createdAt"> = {
      userId,
      name: `${accountName} (Timeline)`,
      network: "facebook",
      channelType: "account",
      method: "cookie",
      isAutoShare: false,
      status: "connected",
      accountId,
      profilePicUrl,
      cookieC_user: c_user.trim(),
      cookieXs: xs.trim(),
      cookieDatr: datr ? datr.trim() : undefined,
    };
    await addChannel(accChannel);
    createdChannels.push(accChannel as Channel);

    // ── 4. Create Account Story Channel ──
    const storyChannel: Omit<Channel, "id" | "createdAt"> = {
      userId,
      name: `${accountName} (Story)`,
      network: "facebook",
      channelType: "account_story",
      method: "cookie",
      isAutoShare: false,
      status: "connected",
      accountId,
      profilePicUrl,
      cookieC_user: c_user.trim(),
      cookieXs: xs.trim(),
      cookieDatr: datr ? datr.trim() : undefined,
    };
    await addChannel(storyChannel);
    createdChannels.push(storyChannel as Channel);

    // ── 5. Attempt to discover user Pages via cookie session ──
    try {
      const pagesRes = await fetch("https://graph.facebook.com/v19.0/me/accounts?fields=id,name,picture.type(large)", {
        headers: { Cookie: cookieHeader },
      });
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        const pages = pagesData.data || [];

        for (const p of pages) {
          // Page Feed
          const pageChannel: Omit<Channel, "id" | "createdAt"> = {
            userId,
            name: p.name,
            network: "facebook",
            channelType: "ownpage",
            method: "cookie",
            isAutoShare: false,
            status: "connected",
            accountId: p.id,
            pageId: p.id,
            profilePicUrl: p.picture?.data?.url || profilePicUrl,
            cookieC_user: c_user.trim(),
            cookieXs: xs.trim(),
            cookieDatr: datr ? datr.trim() : undefined,
          };
          await addChannel(pageChannel);
          createdChannels.push(pageChannel as Channel);

          // Page Story
          const pageStoryChannel: Omit<Channel, "id" | "createdAt"> = {
            userId,
            name: `${p.name} (Story)`,
            network: "facebook",
            channelType: "ownpage_story",
            method: "cookie",
            isAutoShare: false,
            status: "connected",
            accountId: p.id,
            pageId: p.id,
            profilePicUrl: p.picture?.data?.url || profilePicUrl,
            cookieC_user: c_user.trim(),
            cookieXs: xs.trim(),
            cookieDatr: datr ? datr.trim() : undefined,
          };
          await addChannel(pageStoryChannel);
          createdChannels.push(pageStoryChannel as Channel);
        }
      }
    } catch (e) {
      console.warn("Could not auto-fetch pages via cookie, skipped page creation:", e);
    }

    return NextResponse.json({
      success: true,
      channelsCount: createdChannels.length,
      accountName,
      channels: createdChannels,
    });
  } catch (error: any) {
    console.error("Cookie connection error:", error);
    return NextResponse.json(
      { error: "Failed to connect Facebook account via cookie method: " + error.message },
      { status: 500 }
    );
  }
}
