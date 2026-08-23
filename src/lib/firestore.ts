import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

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

export type SocialAccountsData = {
  facebook?: FacebookCredentials;
  twitter?: TwitterCredentials;
};

/**
 * Saves the credentials for a specific provider for the given user.
 */
export async function saveCredentials(
  userId: string,
  provider: "facebook" | "twitter",
  credentials: FacebookCredentials | TwitterCredentials
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
