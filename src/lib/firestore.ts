import { db } from "./firebase";
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";

export type FacebookCredentials = {
  appId: string;
  appSecret: string;
  pageAccessToken: string;
};

export type TwitterCredentials = {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
};

export type AiCredentials = {
  grokApiKey: string;
  geminiApiKey: string;
};

export type SocialAccountsData = {
  facebook?: FacebookCredentials;
  twitter?: TwitterCredentials;
  ai?: AiCredentials;
};

/**
 * Saves the credentials for a specific provider for the given user.
 */
export async function saveCredentials(
  userId: string,
  provider: "facebook" | "twitter" | "ai",
  credentials: FacebookCredentials | TwitterCredentials | AiCredentials
) {
  const userRef = doc(db, "users", userId);
  
  // We use setDoc with merge: true to avoid overwriting other providers
  await setDoc(userRef, {
    socialAccounts: {
      [provider]: credentials
    },
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Fetches all saved credentials for the given user.
 */
export async function getCredentials(userId: string): Promise<SocialAccountsData | null> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return data.socialAccounts as SocialAccountsData;
  }

  return null;
}

export type PostStatus = "pending" | "published" | "rejected";

export type Post = {
  id?: string;
  content: string;
  networks: string[];
  authorId: string;
  authorEmail: string;
  status: PostStatus;
  createdAt: any;
};

export async function createPendingPost(post: Omit<Post, "id" | "status" | "createdAt">) {
  const postsRef = collection(db, "posts");
  await addDoc(postsRef, {
    ...post,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

/**
 * Creates a new published post for a user.
 */
export async function createPublishedPost(post: Omit<Post, "id" | "status" | "createdAt">) {
  const postsRef = collection(db, "posts");
  await addDoc(postsRef, {
    ...post,
    status: "published",
    createdAt: serverTimestamp(),
  });
}

/**
 * Fetches all pending posts (for Admins).
 */
export async function getPendingPosts(): Promise<Post[]> {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("status", "==", "pending"));
  const snap = await getDocs(q);
  
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Post));
}

/**
 * Updates a post status.
 */
export async function updatePostStatus(postId: string, status: PostStatus) {
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, {
    status,
    updatedAt: serverTimestamp()
  });
}

/**
 * Gets a user's role.
 */
export async function getUserRole(userId: string): Promise<"admin" | "user"> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data().role || "user";
  }
  return "user";
}
