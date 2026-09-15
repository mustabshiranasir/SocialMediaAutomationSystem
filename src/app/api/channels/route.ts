import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

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
      .collection("channels")
      .where("userId", "==", userId)
      .get();

    const safeChannels = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        network: data.network,
        channelType: data.channelType,
        method: data.method,
        isAutoShare: data.isAutoShare,
        status: data.status,
        accountId: data.accountId,
        pageId: data.pageId,
        groupId: data.groupId,
        profilePicUrl: data.profilePicUrl,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        connectedAt: data.connectedAt,
      };
    });

    return NextResponse.json({ channels: safeChannels });
  } catch (error: any) {
    console.error("[GET /api/channels] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
