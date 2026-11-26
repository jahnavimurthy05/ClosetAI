# ClosetAI – Your Personal Fashion Stylist

An AI-powered wardrobe management and outfit recommendation web application. ClosetAI helps you catalogue your clothes, get personalized outfit suggestions based on your body profile, colour palette, and style preferences, and plan outfits for upcoming events.

---

## Overview

| Feature | Description |
|---|---|
| 📸 Smart Wardrobe | Upload clothing photos; AI auto-tags category, colour, pattern, and style |
| 👗 Outfit Recommendations | AI-generated outfit combinations tailored to weather, occasion & preferences |
| 📅 Outfit Calendar | Plan and track outfits by date/event |
| 🎨 Colour Analysis | Personalized colour palette recommendations based on your complexion & undertone |
| 📊 Analytics | Wardrobe utilization insights, most-worn items, cost-per-wear |
| 💬 AI Stylist Chat | Natural-language fashion advice powered by Gemini |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Lucide React, Framer Motion |
| State Management | Zustand |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| AI Processing | Python FastAPI service (Phase 2) with Gemini Vision |
| Deployment | Vercel (frontend) + Render (Python AI service) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│  Next.js 14 App (Vercel)                                    │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐               │
│  │  Auth    │  │ Dashboard │  │  Wardrobe  │               │
│  │  Pages   │  │  Pages    │  │   Pages    │               │
│  └──────────┘  └───────────┘  └────────────┘               │
│       │               │               │                     │
│  ┌────▼───────────────▼───────────────▼──────┐             │
│  │           Next.js API Routes               │             │
│  │  /api/profile  /api/wardrobe  /api/outfits │             │
│  │  /api/calendar /api/analytics /api/chat    │             │
│  └────────────────────┬───────────────────────┘             │
└───────────────────────┼─────────────────────────────────────┘
                        │
          ┌─────────────▼──────────────┐
          │        Supabase            │
          │  ┌──────┐  ┌──────────┐   │
          │  │ Auth │  │ Postgres │   │
          │  └──────┘  └──────────┘   │
          │  ┌──────────────────────┐ │
          │  │  Storage (S3-compat) │ │
          │  └──────────────────────┘ │
          └────────────────────────────┘
                        │
          ┌─────────────▼──────────────┐
          │   Python AI Service        │
          │   (FastAPI on Render)      │
          │   - Gemini Vision          │
          │   - Image processing       │
          │   - Outfit scoring         │
          └────────────────────────────┘
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Supabase CLI (`npm install -g supabase`)
- A Supabase project (free tier works)

### 1. Clone & Install

```bash
git clone <repo-url>
cd DressRecomm/closetai-frontend
pnpm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your actual values (see Environment Variables section)
```

### 3. Run Development Server

```bash
pnpm dev
# Open http://localhost:3000
```

---

## Supabase Setup

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) → New Project.

### 2. Run the Database Migration

In your Supabase project → SQL Editor, paste and run:

```
supabase/migrations/001_initial_schema.sql
```

### 3. Configure Storage

In SQL Editor, also run:

```
supabase/storage.sql
```

### 4. Get Your API Keys

Supabase Dashboard → Settings → API:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret, server-side only)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server only) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your app's public URL (e.g. http://localhost:3000) |
| `AI_SERVICE_URL` | ⚙️ | Python AI service base URL |
| `AI_SERVICE_API_KEY` | ⚙️ | API key for AI service authentication |
| `OPENWEATHER_API_KEY` | ⚙️ | OpenWeatherMap key for weather-based recommendations |
| `NEXT_PUBLIC_GA_ID` | ⚙️ | Google Analytics measurement ID (optional) |

---

## Deployment

### Frontend → Vercel

1. Push your code to GitHub
2. Import the repository in [vercel.com](https://vercel.com)
3. Set **Root Directory** to `closetai-frontend`
4. Add all environment variables from `.env.local`
5. Deploy

### Python AI Service → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Point to the `ai-service/` directory
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Update `AI_SERVICE_URL` in your Vercel deployment

---

## API Documentation

### Authentication

All API routes require a valid Supabase session cookie. Unauthenticated requests return `401 Unauthorized`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profile` | Fetch user profile + sub-profiles |
| PUT | `/api/profile` | Update user profile |
| GET | `/api/wardrobe` | List wardrobe items (supports `?category=`, `?search=`, `?formality=`) |
| POST | `/api/wardrobe` | Create new wardrobe item |
| GET | `/api/wardrobe/[id]` | Get single wardrobe item |
| PUT | `/api/wardrobe/[id]` | Update wardrobe item |
| DELETE | `/api/wardrobe/[id]` | Delete wardrobe item |
| GET | `/api/outfits` | List user's outfits |
| POST | `/api/outfits` | Create outfit |
| POST | `/api/outfits/recommend` | Generate AI outfit recommendation |
| GET | `/api/calendar` | Get calendar entries (`?month=YYYY-MM`) |
| POST | `/api/calendar` | Create calendar entry |
| PUT | `/api/calendar` | Update calendar entry |
| GET | `/api/analytics` | Get wardrobe analytics/stats |
| POST | `/api/chat` | Send message to AI stylist |

---

## Project Structure

```
closetai-frontend/
├── app/
│   ├── (auth)/              # Auth pages (login, register)
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── dashboard/       # Main dashboard
│   │   ├── wardrobe/        # Wardrobe management
│   │   ├── outfits/         # Outfit pages
│   │   ├── calendar/        # Calendar
│   │   ├── analytics/       # Analytics
│   │   ├── profile/         # User profile
│   │   └── settings/        # Settings
│   ├── onboarding/          # Onboarding flow
│   ├── api/                 # Next.js API routes
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── wardrobe/            # Wardrobe-specific components
│   ├── outfits/             # Outfit components
│   └── ui/                  # shadcn/ui components
├── lib/
│   └── supabase/            # Supabase client setup
├── types/
│   └── index.ts             # TypeScript type definitions
├── middleware.ts             # Auth middleware
└── supabase/
    ├── migrations/           # SQL migrations
    └── storage.sql           # Storage bucket config
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push and open a Pull Request

---

## License

MIT License – see [LICENSE](LICENSE) for details.
