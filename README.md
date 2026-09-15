# 🚀 Social Media Automation System

> **AI-powered SaaS platform for automated social media content generation, scheduling, and publishing.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28?logo=firebase)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com)

---

## 📖 Overview

The **Social Media Automation System** is an application similar to FS Poster that allows users to connect multiple social media accounts, create and schedule posts, and publish content automatically. It uses Firebase for authentication and data storage, with a Next.js backend and React frontend. It also uses AI to generate tailored social media content, allowing teams to collaborate, require admin approvals, and seamlessly publish to multiple platforms.

The application supports three account connection methods where available: Standard App, Personal App, and Cookie-based connection. In the Personal App method, each user creates one developer app per social media platform and can use it to connect multiple accounts on that platform. Each user's credentials, connected accounts, and posts remain separate.

The goal is to provide a free-to-use autoposting system, subject to each social platform's API access, permissions, and policies.

### Key Features

- 🤖 **AI Content Generation** — Generates tailored content, captions, and hashtags using Google Gemini and Groq AI models.
- 📅 **Post Scheduling & Publishing** — Schedule and publish posts directly to Twitter, Facebook, and LinkedIn.
- ✅ **Approval Workflow** — Built-in review system allowing team members to draft posts for admin approval.
- 📊 **Analytics Dashboard** — Track performance and engagement metrics for your posts.
- 🖼️ **Media Library** — Integrated with Cloudinary for managing and hosting images and media assets.
- 👥 **Team Management** — Role-based access control (RBAC) via Firebase Auth for managing admin and user permissions.
- 🔔 **Notifications & Emails** — Real-time notifications and email alerts powered by Resend.

---

## 🏗️ Architecture

The project has migrated to a unified **Next.js Full-Stack (Serverless)** architecture, utilizing Next.js App Router and API Routes backed by Firebase.

```text
Next.js 16 (App Router)
      │
      ├── Frontend (React 19, Tailwind CSS v4, Zustand)
      │
      └── Backend (Next.js API Routes)
            ├── Firebase Admin (Auth & Firestore)
            ├── AI Integrations (Gemini, Groq)
            ├── Social APIs (Twitter, Facebook, LinkedIn)
            └── Cloudinary (Media) & Resend (Emails)
```

*(Note: The repository also contains legacy `backend/` (FastAPI) and `frontend/` (Vite) folders from an older architecture iteration.)*

---

## 📦 Project Structure

```text
Social-Media-Automation-System/
├── src/                          # Main Next.js application
│   ├── app/                      # App Router pages and API routes
│   │   ├── (auth)/               # Authentication pages
│   │   ├── (dashboard)/          # Main dashboard views (analytics, compose, posts, etc.)
│   │   └── api/                  # Serverless API routes (auth, generate, publish, etc.)
│   ├── components/               # Reusable React UI components
│   ├── context/                  # React Context providers
│   ├── lib/                      # Shared utilities, Firebase config, Social publishers
│   └── types/                    # TypeScript type definitions
│
├── public/                       # Static assets
├── backend/                      # [Legacy] Python FastAPI backend
└── frontend/                     # [Legacy] Vite React frontend
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Firebase Project (Auth & Firestore)
- Cloudinary Account (for media)
- API Keys for AI (Gemini/Groq) and Social Platforms

---

### Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.local.example` to `.env.local` (or create one) and configure your keys:
   ```env
   # Firebase configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   
   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
   
   # Server-side secrets (Firebase Admin, Resend, etc.)
   FIREBASE_PRIVATE_KEY=...
   FIREBASE_CLIENT_EMAIL=...
   RESEND_API_KEY=...
   ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🌐 Supported Platforms

| Platform | Post | Schedule | Analytics |
|----------|------|----------|-----------|
| Twitter / X | ✅ | ✅ | ✅ |
| Facebook | ✅ | ✅ | ✅ |
| LinkedIn | ✅ | ✅ | ✅ |

---

## 🚢 Deployment

The application is optimized for deployment on Vercel:

```bash
npm run build
npm start
```

Alternatively, connect your GitHub repository directly to Vercel for automatic deployments on push. Ensure all environment variables are added in your Vercel project settings.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
