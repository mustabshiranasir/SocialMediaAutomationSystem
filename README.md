# 🚀 AI-Powered Social Media Content Generation & Management Engine

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite_8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/Database-SQLite_SQLAlchemy-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

A full-stack, enterprise-grade social media content generation, campaign management, and analytics tracking platform built using the **Model-View-Controller (MVC)** architectural pattern. The system combines a high-performance **FastAPI** backend orchestrating 10 specialized AI Skills with a sleek, dark-mode glassmorphism **React 19 + Vite** single-page web application.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Core Features](#-core-features)
- [Complete Project Directory Structure](#-complete-project-directory-structure)
- [Step-by-Step Installation & Setup Guide](#-step-by-step-installation--setup-guide)
  - [Prerequisites](#1-prerequisites)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Backend Setup & Environment Configuration](#step-2-backend-setup--environment-configuration)
  - [Step 3: Frontend Setup & Running the UI](#step-3-frontend-setup--running-the-ui)
- [Step-by-Step User Workflow Guide](#-step-by-step-user-workflow-guide)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Testing & Verification](#-testing--verification)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [License](#-license)

---

## 🏛️ Architectural Overview

The application follows strict **MVC (Model-View-Controller)** separation of concerns:

- **Model Layer (`backend/app/models.py`)**: SQLAlchemy ORM entities representing Users, Campaigns, Prompts, Drafts, Approvals, Linked Accounts, Published Posts, and Analytics.
- **Controller Layer (`backend/app/routers/`)**: Modular FastAPI route handlers managing business logic, user authentication, AI prompt orchestration, approval workflows, publishing, and metric collection.
- **View Layer (`frontend/src/`)**: Component-driven React application delivering interactive campaign management, real-time draft review queues, live preview overlays, and engagement analytics.
- **AI Engine Layer (`backend/app/skills/`)**: 10 modular AI skills working together to handle prompt engineering, platform text formatting, hashtag SEO, asset generation, notification logging, and system health checks.

```
                  +-----------------------------------+
                  |   React 19 + Vite Web Application |
                  |            (View Layer)           |
                  +-----------------+-----------------+
                                    |
                                    | HTTP / REST API Calls
                                    v
                  +-----------------------------------+
                  |       FastAPI Application         |
                  |         (Controller Layer)        |
                  +--------+----------------+---------+
                           |                |
           SQLAlchemy ORM  |                | Orchestrates
                           v                v
      +----------------------+   +--------------------------+
      |  SQLite Database     |   |   10 AI Skills Modules   |
      |   (Model Layer)      |   | (Content, Images, SEO...) |
      +----------------------+   +--------------------------+
```

---

## ✨ Core Features

### 🎯 1. Campaign Management Module
- Create, list, inspect, and delete named marketing campaigns (e.g. *"Summer Product Launch 2026"*).
- Target multiple social platforms (*LinkedIn, Instagram, Twitter, Facebook*) per campaign.
- Define start and end date boundaries for strategic scheduling.
- Real-time aggregation of campaign metrics (total drafts generated, published posts, reach, likes, CTR).

### 🤖 2. Multi-Platform AI Content Generation
- Accepts broad campaign ideas or prompts and formats tailored posts for individual social networks.
- Brand Writing Tone selector: **Professional / Corporate**, **Bold / Energetic**, **Friendly / Social**, or **Witty / Playful**.
- Generates platform-specific previews, key talking points, target audience notes, and call-to-action (CTA) strings.
- Automated Hashtag & SEO keyword optimization (`hashtag_seo.py`).

### 🎨 3. Visual Asset & Image Generation Engine
- Automatic canvas rendering for post imagery with customizable gradient themes and typography (`image_gen.py`).
- Cache-busted static asset serving (`/static/media/`) linked directly to drafts.
- On-demand image re-generation based on updated copy or user directives.

### 🔄 4. Review Queue & Interactive AI Refinement
- Draft review queue for reviewing, modifying, and approving posts before publishing.
- **AI Improvement Prompting**: Instruct AI to adjust tone, expand details, or fix style via natural language (e.g., *"Make it shorter with more emojis"*).
- **Manual Content Editor**: Live visual modal allowing inline editing of titles, captions, descriptions, and hashtags.

### 📅 5. Scheduling & Automated Publishing Pipelines
- Schedule posts for exact future release date/times using ISO timestamps.
- **Automated Queue Runner**: On-demand or cron execution (`/api/publish/scheduled/run`) to release due scheduled posts automatically.
- Instant force-publishing capability for immediate deployment across linked platforms.

### 📊 6. Engagement Analytics & Registry
- Overview metrics dashboard showing total reach, likes, shares, comments, and click-through rates.
- Published Posts Registry detailing post IDs, platform destination, release timestamp, and engagement counters.

### 🔗 7. Social Channel Connections
- Modular linking engine for Twitter, LinkedIn, Instagram, and Facebook accounts.
- OAuth token simulation and active channel status toggles.

### 🛠️ 8. DevOps Audit & System Health Diagnostics
- Real-time audit endpoint evaluating active skill availability (10/10 active).
- Latency measurement, API schema consistency checks, and cloud autoscaling metrics.

---

## 📂 Complete Project Directory Structure

```text
MVC/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py                  # JWT authentication, hashing, security dependencies
│   │   ├── database.py              # SQLite Engine, SessionLocal, and DB Base
│   │   ├── main.py                  # FastAPI app initialisation, CORS, routers & startup migrations
│   │   ├── models.py                # SQLAlchemy ORM models (User, Campaign, Draft, Analytics, etc.)
│   │   ├── schemas.py               # Pydantic v2 validation models & payload schemas
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── accounts.py          # GET /api/accounts, POST /api/accounts/link, DELETE /api/accounts/{id}
│   │   │   ├── analytics.py         # GET /api/analytics, GET /api/analytics/dashboard/posts
│   │   │   ├── auth.py              # POST /api/auth/register, POST /api/auth/login, POST /api/auth/reset-password
│   │   │   ├── campaigns.py         # CRUD endpoints for /api/campaigns
│   │   │   └── drafts.py            # Draft queue, AI improvement, manual edit, schedule & publish endpoints
│   │   └── skills/
│   │       ├── __init__.py
│   │       ├── account_connectivity.py # Social platform connection skill
│   │       ├── analytics.py            # Performance analytics tracker skill
│   │       ├── cloud_deployment.py     # Cloud container scaling & CI/CD diagnostic skill
│   │       ├── content_writing.py      # Core AI text generation & multi-platform copywriting
│   │       ├── devops_tooling.py       # Full-stack system health audit skill
│   │       ├── digital_marketing.py    # Target audience & CTA strategy skill
│   │       ├── hashtag_seo.py          # Hashtag extraction & SEO optimization skill
│   │       ├── image_gen.py            # Pillow visual canvas image generation skill
│   │       ├── notification.py         # Event logging & notification dispatcher skill
│   │       ├── orchestrator.py         # Master pipeline orchestrator combining all 10 skills
│   │       └── platform_formatting.py  # Platform-specific text parser and formatter skill
│   ├── static/
│   │   ├── media/                   # Generated PNG draft images
│   │   └── notifications.json       # Polled notification event log
│   ├── tests/
│   │   ├── test_api.py              # End-to-end HTTP request integration workflow test
│   │   └── test_client.py           # FastAPI TestClient endpoint verification test suite
│   ├── requirements.txt             # Backend Python dependencies
│   ├── run.py                       # Uvicorn startup script
│   └── social_media_system.db       # SQLite database file (created on startup)
└── frontend/
    ├── public/
    │   ├── favicon.svg              # App browser icon
    │   └── icons.svg                # Platform SVG sprite icons
    ├── src/
    │   ├── assets/                  # SVG assets
    │   ├── App.css                  # Custom glassmorphism UI styles & utility classes
    │   ├── App.jsx                  # Main single-page application component & state manager
    │   ├── index.css                # Global CSS variables, reset, and dark theme background
    │   └── main.jsx                 # React root entry point
    ├── .gitignore
    ├── .oxlintrc.json               # Oxlint configuration
    ├── index.html                   # Main HTML document template
    ├── package.json                 # Node dependencies & package scripts
    ├── package-lock.json            # Node lockfile
    ├── README.md                    # Frontend quickstart pointer
    └── vite.config.js               # Vite bundler configuration
```

---

## 🛠️ Step-by-Step Installation & Setup Guide

Follow these step-by-step instructions to clone, configure, and launch the repository on your local machine.

### 1. Prerequisites

Make sure you have the following installed on your machine:
- **Git**: [git-scm.com](https://git-scm.com/)
- **Python**: Version `3.10` or newer ([python.org](https://www.python.org/))
- **Node.js**: Version `18.0` or newer ([nodejs.org](https://nodejs.org/))
- **npm**: Installed automatically with Node.js (`v9.0`+)

---

### Step 1: Clone the Repository

Open your terminal or command prompt and clone the repository:

```bash
# Clone the repository
git clone https://github.com/maria2469/Social-Media-Automation-System.git

# Navigate into the project root directory
cd Social-Media-Automation-System
```

---

### Step 2: Backend Setup & Environment Configuration

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Create a Virtual Environment**:

   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```

   - **Windows (Command Prompt)**:
     ```cmd
     python -m venv venv
     venv\Scripts\activate.bat
     ```

   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Initialize Database & Start FastAPI Backend**:
   Run the pre-configured launcher script:
   ```bash
   python run.py
   ```

   *Alternatively, start Uvicorn directly with auto-reload enabled:*
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

5. **Verify Backend**:
   - Backend API Server: `http://localhost:8000`
   - Interactive Swagger API Documentation: `http://localhost:8000/docs`
   - ReDoc API Documentation: `http://localhost:8000/redoc`

---

### Step 3: Frontend Setup & Running the UI

1. Open a **new terminal window** and navigate to the project root directory, then into `frontend`:

   ```bash
   cd MVC/frontend
   ```

2. **Install Node Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---

## 🚀 Deployment Guide

### Deploy Backend (Render)
1. Push your repository to GitHub.
2. Log into [Render.com](https://render.com) and create a **New Blueprint**.
3. Connect your repository. Render will automatically detect the `render.yaml` file in the root directory and deploy the FastAPI backend.
4. Go to your Web Service in Render -> **Environment** and add your `GROQ_API_KEY` and `GEMINI_API_KEY`.
5. Copy your live Render URL (e.g., `https://social-api.onrender.com`).

### Deploy Frontend (Firebase)
1. In `frontend/.env.production`, set your live Render URL:
   ```env
   VITE_API_BASE=https://social-api.onrender.com
   ```
2. Install Firebase CLI: `npm install -g firebase-tools`
3. Log in: `firebase login`
4. Initialize Hosting: `cd frontend && firebase init hosting` (Choose `dist` as public directory, and configure as single-page app).
5. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

---

## 🔐 OAuth 2.0 Social Logins Setup

The platform is pre-configured with OAuth 2.0 routes for 14 platforms (LinkedIn, Twitter, Meta, TikTok, YouTube, Reddit, Pinterest, etc.). 

To enable real account linking:
1. Register a Developer Application in the respective platform's portal (e.g., LinkedIn Developer Portal).
2. Set the redirect URI in their portal to: `https://<YOUR-RENDER-URL>/api/oauth/callback/<platform>` (e.g., `.../api/oauth/callback/linkedin`).
3. Add the generated Client IDs and Secrets to your backend Render **Environment** settings (and local `.env`):
   ```env
   LINKEDIN_CLIENT_ID=your_id
   LINKEDIN_CLIENT_SECRET=your_secret
   TWITTER_CLIENT_ID=your_id
   TWITTER_CLIENT_SECRET=your_secret
   # etc...
   ```
Once configured, clicking "Connect" in the React Dashboard will securely redirect the user to the official social login page.

---

## 🎯 Step-by-Step User Workflow Guide

1. **Register / Login**:
   - Open `http://localhost:5173`.
   - Toggle to **Register** mode and create your user account (Select role `admin` or `requester`).
   - Log in to receive your JWT authentication token.

2. **Connect Social Channels**:
   - On the right sidebar, click **Link** under LinkedIn, Instagram, Twitter, or Facebook to activate mock posting channels.

3. **Create a Campaign (Optional but Recommended)**:
   - Navigate to the **🎯 Campaign Manager** tab.
   - Enter a campaign name (e.g. *"AI Product Launch"*), select target platforms, start/end dates, and click **Create Campaign**.

4. **Generate AI Content Drafts**:
   - Return to the **Dashboard** tab.
   - Enter your campaign concept into the **Campaign Topic** field.
   - Select your desired target social channels and **Brand Writing Tone**.
   - Optionally select your newly created campaign from the dropdown.
   - Click **✨ Assemble AI Campaign**.

5. **Review & Refine Drafts**:
   - Scroll down to the **Campaign Review Queue**.
   - Click **Preview / Edit Details** to open the full modal overlay.
   - Use **AI Improvement Directive** to request prompt adjustments (e.g. *"Make caption more punchy"*).
   - Use **Manual Edit** to customize title, caption, or hashtags directly.
   - Click **Regenerate Image** if you want a fresh visual canvas.

6. **Approve & Publish / Schedule**:
   - Click **Approve & Auto-Publish** to immediately launch the post across all linked channels.
   - Or pick a future release date/time in **Schedule Publish Date & Time** before approving.
   - Run the **⏰ Run Scheduled Queue** button anytime to process due scheduled posts.

7. **Track Performance**:
   - Click the **📊 Analytics** tab to view your real-time performance KPI dashboard (Reach, Likes, Shares, Comments, CTR) and the Published Posts Registry.

8. **System Diagnostics**:
   - Check the **🛠️ System Diagnostics** tab to audit the health of all 10 AI Skills and view latency benchmarks.

---

## 📋 API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Authenticate user & get access token | ❌ |
| `POST` | `/api/auth/reset-password` | Reset user password | ❌ |

### Campaign Management (`/api/campaigns`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/campaigns` | Create a new campaign | ✅ |
| `GET` | `/api/campaigns` | List all user campaigns with metrics | ✅ |
| `GET` | `/api/campaigns/{id}` | Get single campaign details & analytics | ✅ |
| `DELETE`| `/api/campaigns/{id}` | Delete campaign (Admin only) | ✅ |

### Content Drafts & AI Skills (`/api`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/prompt` | Submit prompt & trigger AI skills orchestrator | ✅ |
| `GET` | `/api/drafts` | Fetch draft review queue | ✅ |
| `POST` | `/api/drafts/{id}/approve` | Approve draft & trigger auto-publishing | ✅ |
| `POST` | `/api/drafts/{id}/reject` | Reject draft with feedback | ✅ |
| `POST` | `/api/drafts/{id}/improve` | Apply AI improvement prompt | ✅ |
| `PUT` | `/api/drafts/{id}/content` | Manually update draft copy | ✅ |
| `POST` | `/api/drafts/{id}/regenerate-image`| Re-generate draft visual asset | ✅ |
| `POST` | `/api/drafts/{id}/schedule` | Set scheduled publication date/time | ✅ |

### Publishing (`/api/publish`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/publish/{draftId}` | Re-trigger/force publish for draft | ✅ |
| `POST` | `/api/publish/scheduled/run` | Process and publish due scheduled posts | ✅ |

### Social Accounts (`/api/accounts`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/accounts` | Fetch user's connected social channels | ✅ |
| `POST` | `/api/accounts/link` | Link a new social channel | ✅ |
| `DELETE`| `/api/accounts/{id}` | Unlink a social channel | ✅ |

### Analytics & System (`/api`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/analytics` | Get total engagement metrics overview | ✅ |
| `GET` | `/api/analytics/dashboard/posts` | Get detailed published posts registry | ✅ |
| `GET` | `/api/notifications` | Fetch real-time system notification logs | ❌ |
| `GET` | `/api/system/health` | Live diagnostic health audit of 10 AI skills | ❌ |
| `GET` | `/api/system/cloud-status` | Cloud deployment and autoscaling status | ❌ |

---

## 🧪 Testing & Verification

The project includes an automated test suite using `TestClient` and `requests`.

### Run TestClient Test Suite

```bash
cd backend
# Set PYTHONPATH to project root
$env:PYTHONPATH="."  # PowerShell
# or: set PYTHONPATH=. (Command Prompt)
# or: export PYTHONPATH=. (macOS/Linux)

python tests/test_client.py
```

### Expected Test Output
```text
Created Draft #1
Successfully edited Draft #1
Successfully Approved and Published Draft #1
Force Publish verified for Draft #1
ALL TESTS PASSED SUCCESSFULLY!
```

---

## ❓ Troubleshooting & FAQ

#### Q: Getting `422 Unprocessable Entity` when creating a campaign?
**A**: Ensure your backend code uses the updated `CampaignCreate` schema with `target_platforms: Union[List[str], str]`. This allows creating campaigns with optional dates and without forcing prompt arrays.

#### Q: Frontend shows `[object Object]` when an API request fails?
**A**: The frontend `App.jsx` handles Pydantic error details arrays cleanly. Ensure you are running the latest version of `App.jsx`.

#### Q: `ModuleNotFoundError: No module named 'app'` when running tests?
**A**: Run tests with `PYTHONPATH=.` set in your terminal:
```bash
$env:PYTHONPATH="."; python tests/test_client.py
```

#### Q: CORS errors when calling backend from frontend?
**A**: The FastAPI app in `backend/app/main.py` has `CORSMiddleware` configured to allow `http://localhost:5173` and `*`. Verify the backend server is running on port `8000`.

---

## 📄 License

This project is open-source software licensed under the **[MIT License](LICENSE)**.
