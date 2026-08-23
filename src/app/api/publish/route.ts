import { NextResponse } from "next/response";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { publishToFacebook, publishToTwitter } from "@/lib/publishers";
import { SocialAccountsData } from "@/lib/firestore";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (err) {
      console.error("Token verification failed", err);
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }
    
    const userId = decodedToken.uid;

    const { content, networks } = await req.json();

    if (!content || !networks || !networks.length) {
      return NextResponse.json(
        { error: "Content and at least one network are required" },
        { status: 400 }
      );
    }

    // Fetch user credentials from Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User credentials not found" }, { status: 404 });
    }

    const data = userDoc.data();
    const socialAccounts = data?.socialAccounts as SocialAccountsData | undefined;

    if (!socialAccounts) {
      return NextResponse.json({ error: "No social accounts connected" }, { status: 400 });
    }

    const results = [];
    
    // Execute posts concurrently
    const promises = networks.map(async (network: string) => {
      try {
        if (network === "facebook") {
          const fbCreds = socialAccounts.facebook;
          if (!fbCreds?.pageAccessToken) throw new Error("Facebook Page Access Token missing");
          await publishToFacebook(content, fbCreds.pageAccessToken);
          return { network, status: "success" };
        } 
        
        if (network === "twitter") {
          const twCreds = socialAccounts.twitter;
          if (!twCreds?.apiKey || !twCreds?.apiSecret || !twCreds?.accessToken || !twCreds?.accessTokenSecret) {
            throw new Error("Twitter credentials missing");
          }
          await publishToTwitter(content, {
            appKey: twCreds.apiKey,
            appSecret: twCreds.apiSecret,
            accessToken: twCreds.accessToken,
            accessSecret: twCreds.accessTokenSecret,
          });
          return { network, status: "success" };
        }
      } catch (error: any) {
        return { network, status: "error", error: error.message };
      }
    });

    const settledResults = await Promise.all(promises);
    return NextResponse.json({ success: true, results: settledResults });

  } catch (error: any) {
    console.error("Publishing error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
