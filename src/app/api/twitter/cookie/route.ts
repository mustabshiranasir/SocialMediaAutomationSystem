import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ") || authHeader.split("Bearer ")[1] === "null") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    const idToken = authHeader.split("Bearer ")[1].trim();
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      userId = decodedToken.uid; // User ID derived only from verified token
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 });
    }

    // Endpoint exists only to support cookie-based access.
    // Disabling it safely as per security policy.
    return NextResponse.json(
      { error: "Cookie-based Twitter connection is deprecated and disabled. Please migrate to official OAuth." },
      { status: 410 }
    );
  } catch (err: any) {
    console.error("[TwitterCookieRoute Error]:", err);
    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
