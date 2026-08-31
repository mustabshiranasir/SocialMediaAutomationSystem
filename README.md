# 🚀 Social Media Automation System

> **AI-powered SaaS platform for automated social media content generation, scheduling, and publishing — with a WordPress plugin for seamless integration.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![WordPress](https://img.shields.io/badge/WordPress-Plugin-21759B?logo=wordpress)](https://wordpress.org)

---

## 📖 Overview

The **Social Media Automation System** is a full-stack SaaS platform that uses AI to generate, schedule, and publish social media content across 15+ platforms. WordPress site owners can manage their entire social media presence directly from the WordPress admin dashboard via our official plugin.

### Key Features

- 🤖 **AI Content Generation** — Generates captions, hashtags, descriptions, and images from a simple prompt
- 📅 **Post Scheduling** — Schedule posts across all platforms with a single action
- ✅ **Approval Workflow** — Requester → Admin review → Publish state machine
- 📊 **Analytics Dashboard** — Likes, shares, reach, CTR per platform per post
- 🔌 **WordPress Plugin** — Full social media management inside WP admin
- 🏢 **Multi-Tenant SaaS** — Each WordPress site gets its own isolated API key & data
- 🧩 **Plugin Architecture** — Add new social platforms as drop-in modules

---

## 🏗️ Architecture

```
WordPress Admin Dashboard
        │
  [WP Plugin - PHP]  ──── REST API (X-API-Key) ────►  SaaS Backend
        │                                                    │
  Settings Page                                     FastAPI (Python)
  Post Scheduler UI                                 AI Skills Engine
  Analytics Widget                                  Next.js Dashboard
                                                    SQLite / PostgreSQL
```

---

## 📦 Project Structure

```
Social-Media-Automation-System/
├── src/                          # Next.js frontend (SaaS dashboard)
│   ├── app/
│   │   ├── (auth)/               # Login, Register pages
│   │   ├── (dashboard)/          # Dashboard, posts, analytics, settings
│   │   │   ├── api-keys/         # API key management for WP plugin
│   │   │   ├── tenants/          # Tenant/account management
│   │   │   └── settings/         # App settings + WP plugin setup
│   │   └── api/                  # Next.js API routes
│   ├── components/               # Reusable UI components
│   └── lib/                      # Shared utilities
│
├── backend/                      # Python FastAPI backend
│   ├── app/
│   │   ├── routers/              # API route handlers
│   │   │   ├── auth.py           # JWT auth (register/login)
│   │   │   ├── drafts.py         # Draft CRUD + AI generation
│   │   │   ├── accounts.py       # Social account linking
│   │   │   ├── analytics.py      # Analytics endpoints
│   │   │   ├── campaigns.py      # Campaign management
│   │   │   ├── oauth.py          # OAuth flows
│   │   │   ├── apikeys.py        # API key management (SaaS)
│   │   │   ├── tenants.py        # Tenant management (SaaS)
│   │   │   └── wordpress.py      # WordPress plugin endpoints
│   │   ├── skills/               # AI skill modules
│   │   │   ├── orchestrator.py   # AI pipeline coordinator
│   │   │   ├── content_writing.py
│   │   │   ├── image_gen.py
│   │   │   ├── hashtag_seo.py
│   │   │   ├── platform_formatting.py
│   │   │   └── ...              # 13 skill modules total
│   │   ├── plugins/              # Extensible platform plugin system
│   │   │   ├── base_plugin.py    # Abstract base class
│   │   │   └── platforms/        # Per-platform plugin modules
│   │   ├── models.py             # SQLAlchemy ORM models
│   │   ├── schemas.py            # Pydantic request/response schemas
│   │   ├── auth.py               # JWT helpers
│   │   ├── api_key_auth.py       # API key authentication
│   │   └── database.py           # DB engine + session
│   └── requirements.txt
│
├── wordpress-plugin/             # WordPress plugin (PHP)
│   └── social-media-automator/
│       ├── social-media-automator.php  # Main plugin file
│       ├── admin/
│       │   ├── settings-page.php       # API key + connection settings
│       │   ├── post-scheduler.php      # Post scheduling UI
│       │   └── analytics-widget.php    # Dashboard analytics widget
│       ├── includes/
│       │   ├── api-client.php          # PHP API client
│       │   └── class-scheduler.php     # WP Cron integration
│       └── assets/
│           ├── admin.css
│           └── admin.js
│
└── docs/
    └── api-reference.md          # Full API reference for WP plugin
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- WordPress 6.0+ (for the plugin)

---

### 1. Frontend (Next.js Dashboard)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### 2. Backend (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate     # Windows
source venv/bin/activate  # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env — set JWT_SECRET_KEY, GOOGLE_API_KEY, DATABASE_URL

# Run the API server
python run.py
```

API docs available at [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 3. WordPress Plugin

1. Download `wordpress-plugin/social-media-automator.zip` (or zip the folder manually)
2. In your WordPress admin: **Plugins → Add New → Upload Plugin**
3. Upload and activate `social-media-automator.zip`
4. Go to **Settings → Social Media Automator**
5. Enter your **API Key** (generated in your SaaS dashboard)
6. Click **Test Connection** — you should see a green ✅
7. Go to **Social Media → Schedule Post** to start posting!

---

## 🔑 API Key Authentication (WordPress Plugin)

The WordPress plugin authenticates to the SaaS backend using an API key:

```
X-API-Key: sma_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Generate API keys in your SaaS dashboard under **Settings → API Keys**.

---

## 🌐 Supported Platforms

| Platform | Post | Schedule | Analytics |
|----------|------|----------|-----------|
| Instagram | ✅ | ✅ | ✅ |
| Twitter / X | ✅ | ✅ | ✅ |
| LinkedIn | ✅ | ✅ | ✅ |
| Facebook | ✅ | ✅ | ✅ |
| TikTok | ✅ | ✅ | ✅ |
| YouTube | ✅ | ✅ | ✅ |
| Pinterest | ✅ | ✅ | ✅ |
| Reddit | ✅ | ✅ | ✅ |
| Telegram | ✅ | ✅ | ⚠️ |
| Threads | ✅ | ✅ | ⚠️ |
| WordPress | ✅ | ✅ | ⚠️ |
| Google Business | ✅ | ✅ | ⚠️ |

✅ = Supported &nbsp;&nbsp; ⚠️ = Partial / Mock

---

## 🧩 Adding a New Platform (Plugin Architecture)

Create a new file in `backend/app/plugins/platforms/`:

```python
# backend/app/plugins/platforms/my_platform_plugin.py
from ..base_plugin import BasePlatformPlugin

class MyPlatformPlugin(BasePlatformPlugin):
    name = "myplatform"

    def publish(self, content: dict, credentials: dict) -> str:
        # Your publish logic here
        return "post_id_123"

    def fetch_analytics(self, post_id: str) -> dict:
        return {"likes": 0, "shares": 0, "reach": 0}

    def get_capabilities(self) -> dict:
        return {"supports_images": True, "max_chars": 280}
```

The plugin is auto-discovered at startup. No core code changes needed.

---

## 📡 WordPress Plugin API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wp/connect` | Verify API key, return tenant info |
| POST | `/api/wp/post` | Submit content for AI generation |
| GET | `/api/wp/posts` | List scheduled/published posts |
| POST | `/api/wp/schedule` | Schedule a post |
| GET | `/api/wp/analytics` | Analytics summary for this site |

Full reference: [docs/api-reference.md](docs/api-reference.md)

---

## 🔄 Draft & Approval Workflow

```
Prompt Submitted
       │
       ▼
  AI Generation (orchestrator.py)
       │
       ▼
  Draft Created → "Under Review"
       │
   ┌───┴───┐
   │       │
Approved  Rejected ──► AI Regeneration
   │                        │
   ▼                        ▼
Published              Under Review (again)
```

---

## 🚢 Deployment

### Deploy Backend to Render

A `render.yaml` is included. Push to GitHub and connect the repo to [Render](https://render.com):

```bash
git push origin main
# Render auto-deploys on push
```

### Environment Variables (Production)

| Variable | Description |
|----------|-------------|
| `JWT_SECRET_KEY` | Secret for JWT token signing |
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_API_KEY` | Gemini AI API key |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |

---

## 🛣️ Roadmap

- [x] AI content generation engine
- [x] Multi-platform publishing
- [x] Approval workflow
- [x] Analytics tracking
- [x] Campaign management
- [ ] WordPress Plugin (PHP) — *in progress*
- [ ] Multi-tenant SaaS API key system — *in progress*
- [ ] Platform plugin architecture — *in progress*
- [ ] Stripe subscription billing
- [ ] Real OAuth for all platforms
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push and open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
