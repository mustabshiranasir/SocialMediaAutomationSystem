// Quick seed script — run once to add demo notifications to Firestore
// Usage: node --env-file=.env.local scripts/seed-notifications.mjs

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const DEMO_USER_ID = "demo-user";

const notifications = [
  {
    userId: DEMO_USER_ID,
    title: "Welcome to Social Auto! 🎉",
    message: "Your account has been set up successfully. Start by connecting your social media channels.",
    type: "success",
    link: "/social-poster",
    read: false,
    createdAt: new Date(),
  },
  {
    userId: DEMO_USER_ID,
    title: "Email Verification Sent",
    message: "We sent a verification email to your registered address. Please verify to unlock all features.",
    type: "info",
    link: null,
    read: false,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    userId: DEMO_USER_ID,
    title: "Post Scheduled Successfully",
    message: "Your LinkedIn post has been scheduled for tomorrow at 9:00 AM.",
    type: "success",
    link: "/social-poster",
    read: true,
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    userId: DEMO_USER_ID,
    title: "Channel Token Expiring Soon",
    message: "Your LinkedIn channel access token expires in 3 days. Please reconnect to avoid interruptions.",
    type: "warning",
    link: "/social-poster",
    read: false,
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    userId: DEMO_USER_ID,
    title: "Media Upload Complete",
    message: "Your image has been uploaded to Cloudinary and is ready to use in your posts.",
    type: "info",
    link: "/media",
    read: true,
    createdAt: new Date(Date.now() - 172800000),
  },
];

const colRef = db.collection("notifications");
for (const notif of notifications) {
  await colRef.add(notif);
  console.log(`✅ Added: ${notif.title}`);
}

console.log("\n✅ All demo notifications seeded successfully!");
process.exit(0);
