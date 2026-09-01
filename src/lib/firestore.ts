import { db } from "./firebase";
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

// ─── Credential Types ─────────────────────────────────────────────────────────

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
  grokApiKey?: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
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

/**
 * Subscribes to real-time credential updates for the given user.
 */
export function subscribeToCredentials(
  userId: string,
  callback: (data: SocialAccountsData | null) => void
): () => void {
  const userRef = doc(db, "users", userId);
  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback((data.socialAccounts as SocialAccountsData) || null);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Real-time credentials subscription error:", error);
    }
  );
}

/**
 * Subscribes to real-time installed plugins updates for the given user.
 */
export function subscribeToInstalledPlugins(
  userId: string,
  callback: (installedPluginIds: string[]) => void
): () => void {
  const userRef = doc(db, "users", userId);
  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback((data.installedPlugins as string[]) || ["ai-content-generator"]);
      } else {
        callback(["ai-content-generator"]);
      }
    },
    (error) => {
      console.error("Real-time plugins subscription error:", error);
    }
  );
}

/**
 * Installs or uninstalls an AI plugin for the given user.
 */
export async function toggleUserPlugin(
  userId: string,
  pluginId: string,
  install: boolean
) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  let current: string[] = ["ai-content-generator"];
  if (userSnap.exists() && Array.isArray(userSnap.data().installedPlugins)) {
    current = userSnap.data().installedPlugins;
  }

  let updated: string[];
  if (install) {
    updated = current.includes(pluginId) ? current : [...current, pluginId];
  } else {
    updated = current.filter(id => id !== pluginId);
  }

  await setDoc(userRef, { installedPlugins: updated }, { merge: true });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export type PostStatus = "pending" | "published" | "rejected" | "scheduled" | "failed";

export type Post = {
  id?: string;
  content: string;
  networks: string[];
  /** IDs of the specific Channel documents this post should be published to */
  channelIds?: string[];
  authorId: string;
  authorEmail: string;
  status: PostStatus;
  scheduledAt?: any;
  mediaUrls?: string[];
  linkUrl?: string;
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

export async function createScheduledPost(post: Omit<Post, "id" | "status" | "createdAt">) {
  const postsRef = collection(db, "posts");
  const docRef = await addDoc(postsRef, {
    ...post,
    status: "scheduled",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function createPublishedPost(post: Omit<Post, "id" | "status" | "createdAt">) {
  const postsRef = collection(db, "posts");
  await addDoc(postsRef, {
    ...post,
    status: "published",
    createdAt: serverTimestamp(),
  });
}

export async function getPendingPosts(): Promise<Post[]> {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("status", "==", "pending"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
}

export async function getAllPosts(): Promise<Post[]> {
  const postsRef = collection(db, "posts");
  const snap = await getDocs(postsRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
}

export async function updatePostStatus(postId: string, status: PostStatus) {
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, { status, updatedAt: serverTimestamp() });
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export async function getUserRole(userId: string): Promise<"admin" | "user"> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data().role || "user";
  }
  return "user";
}

// ─── Channel Types ────────────────────────────────────────────────────────────

/**
 * The sub-type of a connected social channel.
 *
 * Facebook channels available via App Method:  ownpage
 * Facebook channels available via Cookie Method: account, ownpage, group, account_story, ownpage_story
 */
export type ChannelType =
  | "ownpage"         // Facebook Page feed
  | "account"         // Personal Timeline (cookie only)
  | "group"           // Facebook Group (cookie only)
  | "account_story"   // Personal Story (cookie only)
  | "ownpage_story"   // Page Story (cookie only)
  | "profile";        // Generic profile (other networks)

export type ConnectionMethod = "app" | "cookie";

export type Channel = {
  id?: string;
  /** Firebase UID of the user who owns this channel */
  userId: string;
  /** Display name of the page/group/account */
  name: string;
  /** Social network identifier: "facebook", "instagram", "twitter", etc. */
  network: string;
  /** Sub-type of this channel */
  channelType: ChannelType;
  /** How this channel was connected */
  method: ConnectionMethod;
  isAutoShare: boolean;
  status: "connected" | "disconnected" | "error";

  // Identity
  /** Facebook Page ID, Group ID, or User ID */
  accountId?: string;
  /** Facebook Page ID (for ownpage and ownpage_story channel types) */
  pageId?: string;
  /** Facebook Group ID (for group channel type) */
  groupId?: string;
  /** Profile picture URL for the avatar in the UI */
  profilePicUrl?: string;

  // App Method fields
  /** OAuth access token (page-level token for Facebook pages) */
  accessToken?: string;
  refreshToken?: string;
  scopes?: string[];
  tokenExpiry?: number;

  // Cookie Method fields (stored encrypted in production)
  cookieC_user?: string;   // Facebook c_user cookie (user's numeric ID)
  cookieXs?: string;       // Facebook xs session token
  cookieDatr?: string;     // Optional datr cookie for extra stability
  cookieAuthToken?: string; // Twitter auth_token cookie
  cookieCt0?: string;       // Twitter ct0 CSRF cookie

  // Twitter App Method fields
  twitterApiKey?: string;
  twitterApiSecret?: string;
  twitterAccessToken?: string;
  twitterAccessSecret?: string;

  createdAt: any;
};

/**
 * Adds a new channel for a specific user.
 */
export async function addChannel(channel: Omit<Channel, "id" | "createdAt">) {
  const channelsRef = collection(db, "channels");
  const docRef = await addDoc(channelsRef, {
    ...channel,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Fetches all channels belonging to a specific user.
 * If userId is omitted, returns ALL channels (admin use only).
 */
export async function getChannels(userId?: string): Promise<Channel[]> {
  const channelsRef = collection(db, "channels");
  let snap;
  if (userId) {
    const q = query(channelsRef, where("userId", "==", userId));
    snap = await getDocs(q);
  } else {
    snap = await getDocs(channelsRef);
  }
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
}

/**
 * Fetches channels for a user filtered by network.
 */
export async function getChannelsByNetwork(userId: string, network: string): Promise<Channel[]> {
  const channelsRef = collection(db, "channels");
  const q = query(
    channelsRef,
    where("userId", "==", userId),
    where("network", "==", network)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
}

/**
 * Fetches channels by their IDs.
 */
export async function getChannelsByIds(channelIds: string[]): Promise<Channel[]> {
  if (!channelIds.length) return [];
  const results: Channel[] = [];
  for (const id of channelIds) {
    const ref = doc(db, "channels", id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      results.push({ id: snap.id, ...snap.data() } as Channel);
    }
  }
  return results;
}

/**
 * Updates a channel document.
 */
export async function updateChannel(channelId: string, updates: Partial<Channel>) {
  const channelRef = doc(db, "channels", channelId);
  await updateDoc(channelRef, { ...updates, updatedAt: serverTimestamp() });
}

/**
 * Deletes a channel document.
 */
export async function deleteChannel(channelId: string) {
  const channelRef = doc(db, "channels", channelId);
  await deleteDoc(channelRef);
}

/**
 * Subscribes to real-time channel updates for a specific user (or all channels if admin/no userId).
 */
export function subscribeToChannels(
  userId: string | undefined,
  callback: (channels: Channel[]) => void
): () => void {
  const channelsRef = collection(db, "channels");
  const q = userId ? query(channelsRef, where("userId", "==", userId)) : query(channelsRef);
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
      callback(list);
    },
    (err) => {
      console.error("subscribeToChannels error:", err);
    }
  );
}

// ─── Facebook Settings ────────────────────────────────────────────────────────

export type FacebookGeneralSettings = {
  importComments: boolean;
  fetchCommentsTimeframe: "Last week" | "Last 2 weeks" | "Last 3 weeks" | "Last month";
  defaultPostType: "text" | "link" | "image";
  autoShare: boolean;
};

export type FacebookPostSettings = {
  customMessage: string;        // template e.g. {title}
  uploadPostImages: boolean;    // toggle for Upload post image(s)
  attachLink: boolean;          // toggle for Attach post link
  enableFirstComment: boolean;  // toggle for Post a first comment
  firstCommentText: string;     // e.g. @followers
  firstComment: string;         // fallback
  postType: "text" | "link" | "image";
};

export type FacebookStorySettings = {
  storyText: string;             // e.g. "{title}"
  capitalizeStoryText: boolean;  // ucfirst="true"
  urlEncodeStoryText: boolean;   // encoded="true"
  attachStoryLink: boolean;      // toggle for attach story link
  backgroundColor: string;       // e.g. "#636e72"
  titleBackgroundColor: string;  // e.g. "#000000"
  titleBackgroundOpacity: number; // 0-100
  titleColor: string;            // e.g. "#FFFFFF"
  titleTopOffset: number;        // px
  titleLeftOffset: number;       // px
  titleWidth: number;            // px e.g. 660
  titleFontSize: number;         // px e.g. 30
  titleFontFamily: string;       // e.g. "ABeeZee"
  titleRtlMode: boolean;         // toggle for Title RTL mode
};

export type FacebookSettings = {
  general: FacebookGeneralSettings;
  postCustomization: FacebookPostSettings;
  storyCustomization: FacebookStorySettings;
};

export const defaultFacebookSettings: FacebookSettings = {
  general: {
    importComments: true,
    fetchCommentsTimeframe: "Last week",
    defaultPostType: "link",
    autoShare: true,
  },
  postCustomization: {
    customMessage: "{title}\n\n{excerpt}\n\n{url}",
    uploadPostImages: false,
    attachLink: true,
    enableFirstComment: true,
    firstCommentText: "@followers",
    firstComment: "@followers",
    postType: "link",
  },
  storyCustomization: {
    storyText: "{title}",
    capitalizeStoryText: true,
    urlEncodeStoryText: true,
    attachStoryLink: true,
    backgroundColor: "#636e72",
    titleBackgroundColor: "#000000",
    titleBackgroundOpacity: 30,
    titleColor: "#FFFFFF",
    titleTopOffset: 125,
    titleLeftOffset: 30,
    titleWidth: 660,
    titleFontSize: 30,
    titleFontFamily: "ABeeZee",
    titleRtlMode: false,
  },
};

export async function getFacebookSettings(userId: string): Promise<FacebookSettings> {
  const ref = doc(db, "users", userId, "settings", "facebook");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...defaultFacebookSettings, ...snap.data() } as FacebookSettings;
  }
  return defaultFacebookSettings;
}

export async function saveFacebookSettings(userId: string, settings: FacebookSettings) {
  const ref = doc(db, "users", userId, "settings", "facebook");
  await setDoc(ref, settings, { merge: true });
}

// Generic Network Settings (for Blogger, Instagram, Threads, Tiktok, Linkedin, Pinterest, Reddit, YouTube Shorts, Google Business)
export async function getSocialNetworkSettings(userId: string, networkKey: string): Promise<any> {
  const ref = doc(db, "users", userId, "settings", networkKey.toLowerCase());
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data();
  }
  return {
    customMessage: "{title}\n\n{excerpt}\n\n{url}",
    attachLink: true,
    autoShare: true,
  };
}

export async function saveSocialNetworkSettings(userId: string, networkKey: string, data: any) {
  const ref = doc(db, "users", userId, "settings", networkKey.toLowerCase());
  await setDoc(ref, data, { merge: true });
}

// ─── General System & App Settings (FS Poster Matching) ─────────────────────

export type GeneralSettingsData = {
  whoCanAccess: "every_user" | "only_selected";
  selectedRoles: string[];
  allowedPostTypes: string[];
  configureCron: boolean;
  cronCommand: string;
  lastCronRunTime?: string;
};

export const defaultGeneralSettings: GeneralSettingsData = {
  whoCanAccess: "every_user",
  selectedRoles: ["admin"],
  allowedPostTypes: ["Posts", "Pages", "Media"],
  configureCron: true,
  cronCommand: "wget -O /dev/null https://smm.clicktaketech.com/wp-cron.php?doing_wp_cron > /dev/null 2>&1",
  lastCronRunTime: "4s ago",
};

export async function getGeneralSettings(userId: string): Promise<GeneralSettingsData> {
  const ref = doc(db, "users", userId, "settings", "general");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...defaultGeneralSettings, ...snap.data() } as GeneralSettingsData;
  }
  return defaultGeneralSettings;
}

export async function saveGeneralSettings(userId: string, settings: GeneralSettingsData) {
  const ref = doc(db, "users", userId, "settings", "general");
  await setDoc(ref, settings, { merge: true });
}

// ─── Media Settings ──────────────────────────────────────────────────────────

export type MediaSettingsData = {
  thumbnailWidth: number;
  thumbnailHeight: number;
  cropThumbnail: boolean;
  mediumMaxWidth: number;
  mediumMaxHeight: number;
  largeMaxWidth: number;
  largeMaxHeight: number;
  organizeUploadsByDate: boolean;
};

export const defaultMediaSettings: MediaSettingsData = {
  thumbnailWidth: 150,
  thumbnailHeight: 150,
  cropThumbnail: true,
  mediumMaxWidth: 300,
  mediumMaxHeight: 300,
  largeMaxWidth: 1024,
  largeMaxHeight: 1024,
  organizeUploadsByDate: true,
};

export async function getMediaSettings(userId: string): Promise<MediaSettingsData> {
  const ref = doc(db, "users", userId, "settings", "media");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...defaultMediaSettings, ...snap.data() } as MediaSettingsData;
  }
  return defaultMediaSettings;
}

export async function saveMediaSettings(userId: string, settings: MediaSettingsData) {
  const ref = doc(db, "users", userId, "settings", "media");
  await setDoc(ref, settings, { merge: true });
}

export function subscribeToMediaSettings(
  userId: string,
  callback: (settings: MediaSettingsData) => void
): () => void {
  const ref = doc(db, "users", userId, "settings", "media");
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback({ ...defaultMediaSettings, ...snap.data() } as MediaSettingsData);
    } else {
      callback(defaultMediaSettings);
    }
  });
}

// ─── Appearance Settings ──────────────────────────────────────────────────────

export interface SitePageItem {
  id: string;
  title: string;
  slug: string;
  status: "Published" | "Draft" | "Scheduled" | "Trash";
  author: string;
  updatedAt: string;
}

export interface SiteNavItem {
  id: string;
  label: string;
  url: string;
  order: number;
}

export type AppearanceSettingsData = {
  activeThemeId: string;
  installedThemeIds: string[];
  activeFont: string;
  siteTitle?: string;
  siteTagline?: string;
  siteLogo?: string;
  siteIcon?: string;
  primaryColor?: string;
  backgroundColor?: string;
  customCss?: string;
  pages?: SitePageItem[];
  navigation?: SiteNavItem[];
};

export const defaultAppearanceSettings: AppearanceSettingsData = {
  activeThemeId: "",
  installedThemeIds: [],
  activeFont: "Inter",
  siteTitle: "Social Media Posting",
  siteTagline: "Connecting in A Better Way!",
  siteLogo: "",
  siteIcon: "",
  primaryColor: "#000000",
  backgroundColor: "#ffffff",
  customCss: "/* Custom theme styling */\nbody {\n  font-family: var(--font-sans);\n}",
  pages: [
    { id: "page-1", title: "Privacy Policy", slug: "/privacy-policy", status: "Draft", author: "Admin", updatedAt: "2026-09-01" },
    { id: "page-2", title: "Sample Page", slug: "/sample-page", status: "Published", author: "Admin", updatedAt: "2026-09-01" },
    { id: "page-3", title: "About Us", slug: "/about-us", status: "Published", author: "Admin", updatedAt: "2026-09-01" },
    { id: "page-4", title: "Contact", slug: "/contact", status: "Draft", author: "Admin", updatedAt: "2026-09-01" },
  ],
  navigation: [
    { id: "nav-1", label: "Home", url: "/", order: 1 },
    { id: "nav-2", label: "Blog", url: "/blog", order: 2 },
    { id: "nav-3", label: "About Us", url: "/about-us", order: 3 },
    { id: "nav-4", label: "Services", url: "/services", order: 4 },
    { id: "nav-5", label: "Contact", url: "/contact", order: 5 },
  ],
};

export async function getAppearanceSettings(userId: string): Promise<AppearanceSettingsData> {
  const ref = doc(db, "users", userId, "settings", "appearance");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...defaultAppearanceSettings, ...snap.data() } as AppearanceSettingsData;
  }
  return defaultAppearanceSettings;
}

export async function saveAppearanceSettings(userId: string, settings: Partial<AppearanceSettingsData>) {
  const ref = doc(db, "users", userId, "settings", "appearance");
  await setDoc(ref, settings, { merge: true });
}

export function subscribeToAppearanceSettings(
  userId: string,
  callback: (settings: AppearanceSettingsData) => void
): () => void {
  const ref = doc(db, "users", userId, "settings", "appearance");
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback({ ...defaultAppearanceSettings, ...snap.data() } as AppearanceSettingsData);
    } else {
      callback(defaultAppearanceSettings);
    }
  });
}

// ─── Social Apps Management (FS Poster Matching) ───────────────────────────

export type SocialApp = {
  id?: string;
  userId: string;
  name: string;             // e.g. "Tech Doctor Saltcoats", "fs poster"
  platform: string;         // e.g. "blogger", "facebook", "linkedin", "reddit", "tumblr"
  appId: string;            // Client ID / App ID
  appSecret?: string;       // Client Secret / App Secret
  createdAt?: any;
};

export async function getSocialApps(userId?: string): Promise<SocialApp[]> {
  const appsRef = collection(db, "social_apps");
  let snap;
  if (userId) {
    const q = query(appsRef, where("userId", "==", userId));
    snap = await getDocs(q);
  } else {
    snap = await getDocs(appsRef);
  }
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialApp));
}

export async function addSocialApp(app: Omit<SocialApp, "id" | "createdAt">) {
  const appsRef = collection(db, "social_apps");
  const docRef = await addDoc(appsRef, {
    ...app,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteSocialApp(appId: string) {
  const appRef = doc(db, "social_apps", appId);
  await deleteDoc(appRef);
}

// ─── Content Ideas ─────────────────────────────────────────────────────────────

export type ContentIdeaFirestore = {
  id?: string;
  title: string;
  content_preview: string;
  platforms: string[];
  status: "Draft" | "Scheduled" | "Published";
  tags?: string;
  link_url?: string;
  first_comment?: string;
  is_starred?: boolean;
  media_url?: string;
  created_by?: string;
  created_at?: any;
};

export async function getContentIdeas(searchQuery?: string): Promise<ContentIdeaFirestore[]> {
  const ideasRef = collection(db, "content_ideas");
  const snap = await getDocs(ideasRef);
  let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentIdeaFirestore));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.content_preview.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function addContentIdea(idea: Omit<ContentIdeaFirestore, "id" | "created_at">) {
  const ideasRef = collection(db, "content_ideas");
  const docRef = await addDoc(ideasRef, {
    ...idea,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateContentIdea(id: string, updates: Partial<ContentIdeaFirestore>) {
  const ideaRef = doc(db, "content_ideas", id);
  await updateDoc(ideaRef, { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteContentIdea(id: string) {
  const ideaRef = doc(db, "content_ideas", id);
  await deleteDoc(ideaRef);
}
