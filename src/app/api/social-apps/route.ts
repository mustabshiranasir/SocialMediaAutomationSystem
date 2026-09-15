import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

// GET: Fetch all apps for the verified user
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ") || authHeader.split("Bearer ")[1] === "null") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1].trim();
    let userId: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      userId = decodedToken.uid;
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 });
    }

    const snapshot = await adminDb
      .collection("social_apps")
      .where("userId", "==", userId)
      .get();

    const safeApps = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        platform: data.platform,
        appId: data.appId,
        hasSecret: !!data.appSecret,
        createdAt: data.createdAt,
      };
    });

    return NextResponse.json({ apps: safeApps });
  } catch (error: any) {
    console.error("[GET /api/social-apps] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Add a new social app for the verified user
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ") || authHeader.split("Bearer ")[1] === "null") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1].trim();
    let userId: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      userId = decodedToken.uid;
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { name, platform, appId, appSecret } = body;

    if (!name || !platform || !appId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = await adminDb.collection("social_apps").add({
      userId,
      name,
      platform,
      appId,
      appSecret: appSecret || null,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("[POST /api/social-apps] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Delete an existing social app (if owned by user)
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ") || authHeader.split("Bearer ")[1] === "null") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1].trim();
    let userId: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      userId = decodedToken.uid;
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 });
    }

    const url = new URL(req.url);
    const appId = url.searchParams.get("appId");
    if (!appId) {
      return NextResponse.json({ error: "Missing appId" }, { status: 400 });
    }

    const appRef = adminDb.collection("social_apps").doc(appId);
    const appSnap = await appRef.get();
    
    if (!appSnap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (appSnap.data()?.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await appRef.delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/social-apps] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
