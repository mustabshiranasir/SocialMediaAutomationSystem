import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { isAdmin } from "@/lib/permissions";

// Helper to authenticate requests
async function authenticateAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized - No token provided");
  }

  const idToken = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  const userId = decodedToken.uid;

  const userDoc = await adminDb.collection("users").doc(userId).get();
  if (!userDoc.exists || !isAdmin(userDoc.data()?.role || "")) {
    throw new Error("Forbidden - Admin access required");
  }
  
  return userId;
}

export async function GET(req: Request) {
  try {
    await authenticateAdmin(req);

    // Fetch all users from Firebase Auth (max 1000 per batch, good for MVP)
    const listUsersResult = await adminAuth.listUsers(1000);
    
    // Fetch all role data from Firestore
    const usersSnapshot = await adminDb.collection("users").get();
    const roleMap = new Map();
    usersSnapshot.forEach((doc: any) => {
      roleMap.set(doc.id, doc.data().role || "user");
    });

    // Merge data
    const users = listUsersResult.users.map((userRecord: any) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || "",
      creationTime: userRecord.metadata.creationTime,
      role: roleMap.get(userRecord.uid) || "user"
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("GET Users Error:", error);
    return NextResponse.json({ error: error.message }, { status: error.message.includes("Forbidden") ? 403 : 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await authenticateAdmin(req);

    const { targetUserId, newRole } = await req.json();
    const VALID_ROLES = ["subscriber", "contributor", "author", "editor", "administrator", "none"];
    if (!targetUserId || !newRole || !VALID_ROLES.includes(newRole.toLowerCase())) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Update role in Firestore
    await adminDb.collection("users").doc(targetUserId).set({
      role: newRole,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true, newRole });
  } catch (error: any) {
    console.error("PATCH Users Error:", error);
    const msg = error?.message || "Unknown error";
    return NextResponse.json({ error: msg }, { status: msg.includes("Forbidden") ? 403 : 500 });
  }
}

export async function POST(req: Request) {
  try {
    await authenticateAdmin(req);

    const { email, password, name, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Email, password, and role are required" }, { status: 400 });
    }

    // 1. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name || undefined,
    });

    // 2. Create user profile in Firestore with role
    await adminDb.collection("users").doc(userRecord.uid).set({
      email: userRecord.email,
      role: role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        creationTime: userRecord.metadata.creationTime,
        role: role
      }
    });
  } catch (error: any) {
    console.error("POST Users Error details:", error.stack || error);
    const msg = error?.message || "Unknown error";
    return NextResponse.json(
      { error: msg, stack: error?.stack || "No stack trace" }, 
      { status: msg.includes("Forbidden") ? 403 : 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await authenticateAdmin(req);
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 1. Delete user from Firebase Auth
    await adminAuth.deleteUser(targetUserId);

    // 2. Delete user profile from Firestore
    await adminDb.collection("users").doc(targetUserId).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE User Error:", error);
    const msg = error?.message || "Unknown error";
    return NextResponse.json({ error: msg }, { status: msg.includes("Forbidden") ? 403 : 500 });
  }
}
