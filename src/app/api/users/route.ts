import { NextResponse } from "next/response";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

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
  if (!userDoc.exists || userDoc.data()?.role !== "admin") {
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
    usersSnapshot.forEach(doc => {
      roleMap.set(doc.id, doc.data().role || "user");
    });

    // Merge data
    const users = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email,
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

    if (!targetUserId || !newRole || !["admin", "user"].includes(newRole)) {
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
    return NextResponse.json({ error: error.message }, { status: error.message.includes("Forbidden") ? 403 : 500 });
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
    console.error("POST Users Error:", error);
    return NextResponse.json(
      { error: error.message }, 
      { status: error.message.includes("Forbidden") ? 403 : 500 }
    );
  }
}
