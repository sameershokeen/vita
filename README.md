# Vita — Personal Growth App

A full-stack self-improvement tracker with Habits, Goals, Progress charts, Time management, Expense tracking, and Journal — designed with a clean, light, card-based UI inspired by modern productivity dashboards.

## Design System
**Vita** uses a light, soft-canvas theme:
- Background: warm off-white (`#f3f4f1`)
- Cards: pure white with soft rounded corners
- Accent: forest green (`#1d5b3f`) for primary actions and highlights
- Supporting colors: info blue, amber, plum, and coral-red for categories/status
- Sidebar: white rounded panel with a near-black CTA card and user profile footer
- Icons: lucide-react throughout (no emoji) for a clean, consistent look

## Stack
- **Frontend**: Next.js 14 (App Router) · TypeScript · Tailwind CSS · React Query · Zustand · Chart.js
- **Backend**: Express.js · MongoDB · Mongoose · JWT Auth
- **Monorepo**: npm workspaces

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://mongodb.com/atlas) free tier)

### 2. Clone and install
```bash
cd lifetrack
npm run install:all
```

### 3. Configure environment
```bash
# Server
cp server/.env.example server/.env
# Edit server/.env → set MONGODB_URI and JWT_SECRET

# Client
cp client/.env.local.example client/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000 (default, no change needed)
```

### 4. Run (both servers at once)
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/health

## Features

| Module | What it does |
|--------|-------------|
| **Dashboard** | Live overview of all modules, toggle habits, streak count |
| **Habits** | Daily habit tracking, streaks, GitHub-style heatmap, category breakdown |
| **Goals** | Goal cards with progress bars, milestones, color coding |
| **Progress** | Chart.js charts — habit completions, radar, mood, expenses |
| **Time** | Daily time-block scheduler, category stats, completion tracking |
| **Expenses** | Income/expense ledger, category breakdown, budget limits |
| **Journal** | Mood-tagged entries, writing prompts, streak tracker |
| **Auth** | Register, login, forgot password, reset password (with token) |

## Password Reset Flow
1. User clicks "Forgot password?" on login page
2. POST `/api/auth/forgot-password` → generates secure token (SHA-256 hash stored in DB, expires 10 min)
3. In **development**: reset URL is logged to server console AND returned in the API response
4. In **production**: configure SMTP in `server/.env` to send real emails (see `.env.example`)
5. User visits `/reset-password?token=...&email=...` → sets new password → auto-logged in

## Project Structure
```
lifetrack/
├── client/                   # Next.js frontend
│   └── src/
│       ├── app/              # Pages (App Router)
│       │   ├── dashboard/
│       │   ├── habits/
│       │   ├── goals/
│       │   ├── progress/
│       │   ├── time/
│       │   ├── expenses/
│       │   ├── journal/
│       │   ├── login/
│       │   ├── register/
│       │   ├── forgot-password/
│       │   └── reset-password/
│       ├── components/
│       │   ├── ui/           # Shared components (Modal, Button, Input…)
│       │   ├── layout/       # Sidebar, AppShell
│       │   └── habits/       # HabitHeatmap component
│       ├── lib/
│       │   ├── api.ts        # Axios API client
│       │   └── utils.ts      # Helpers, formatters
│       └── store/
│           └── authStore.ts  # Zustand auth store
└── server/                   # Express backend
    └── src/
        ├── models/           # Mongoose schemas
        ├── routes/           # REST API routes
        ├── middleware/       # Auth, error handler
        ├── utils/            # Email / token helpers
        └── config/           # DB connection
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET  | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send reset link |
| POST | `/api/auth/reset-password` | Reset with token |
| POST | `/api/auth/change-password` | Change password (authenticated) |
| GET/POST | `/api/habits` | List / create habits |
| POST | `/api/habits/:id/toggle` | Toggle daily completion |
| GET  | `/api/habits/stats` | Completion stats |
| GET/POST | `/api/goals` | List / create goals |
| POST | `/api/goals/:id/milestones` | Add milestone |
| GET/POST | `/api/time` | Day schedule |
| GET  | `/api/time/stats` | Monthly time stats |
| GET/POST | `/api/expenses` | Transactions |
| GET  | `/api/expenses/summary` | Monthly summary |
| GET/POST | `/api/journal` | Entries |
| GET  | `/api/journal/mood` | Mood history |
| GET  | `/api/journal/streak` | Writing streak |
| GET  | `/api/progress/overview` | Dashboard aggregation |
| GET  | `/api/progress/habits/monthly` | 6-month habit chart data |
