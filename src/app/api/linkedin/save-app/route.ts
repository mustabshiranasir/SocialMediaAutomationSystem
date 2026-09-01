import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// POST /api/linkedin/save-app
// Saves the user's LinkedIn Client ID + Secret to Firestore
export async function POST(req: Request) {
  try {
    const { userId, clientId, clientSecret } = await req.json();

    if (!userId || !clientId || !clientSecret) {
      return NextResponse.json({ error: "Missing userId, clientId or clientSecret" }, { status: 400 });
    }

    // Store credentials under users/{userId}/settings/linkedin_app
    await adminDb
      .collection("users")
      .doc(userId)
      .collection("settings")
      .doc("linkedin_app")
      .set({ clientId, clientSecret, updatedAt: new Date().toISOString() }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save credentials" }, { status: 500 });
  }
}
