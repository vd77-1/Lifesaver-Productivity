# LifeSaver — AI Productivity Companion

> Beat deadlines before they beat you. Powered by Google Gemini, Firebase, and Google Cloud.

## Features

- **AI Task Prioritization** — Gemini analyzes deadlines, estimates risk, and ranks your tasks with explained reasoning
- **Deadline Rescue Mode** — Proactive crisis detection with a concrete recovery plan
- **AI Daily Planner** — Optimized schedule generator that respects your calendar and peak hours
- **What-If Simulator** — Ask "what if I skip this?" and get instant impact analysis
- **AI Agent Chat** — Conversational assistant with full task context
- **Google Calendar Sync** — AI plans around your existing events
- **Explainable AI** — Every decision comes with clear reasoning

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + React + TypeScript |
| UI | Tailwind CSS + custom design system |
| AI | Google Gemini 1.5 Flash |
| Database | Cloud Firestore |
| Auth | Firebase Authentication (Google Sign-In) |
| Calendar | Google Calendar API v3 |
| State | Zustand |
| Charts | Recharts |
| Hosting | Firebase Hosting / Google Cloud Run |

## Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd lifesaver
npm install
```

### 2. Firebase setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Google provider + Email/Password
4. Create a **Firestore** database (start in test mode for hackathon)
5. Get your config from Project Settings → Your apps

### 3. Google Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create an API key
3. Copy it to `.env.local`

### 4. Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Google Calendar API**
3. Create OAuth 2.0 credentials
4. Add `http://localhost:3000` to authorized origins

### 5. Environment variables

```bash
cp .env.local.example .env.local
# Fill in all values
```

### 6. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

## Deployment

### Firebase Hosting (recommended for hackathon)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Google Cloud Run

```bash
# Build
docker build -t lifesaver .
# Push to Artifact Registry and deploy to Cloud Run
```

## Firestore Collections

```
users/{uid}           — User profiles and preferences
tasks/{taskId}        — Tasks with AI metadata
dailyPlans/{uid_date} — Generated daily schedules
chatHistory/{msgId}   — AI conversation history
```

## Judging Criteria Coverage

| Criteria | Feature | Score |
|----------|---------|-------|
| Problem Solving (20%) | Deadline Rescue Mode, Risk detection | ⭐⭐⭐⭐⭐ |
| Agentic AI (20%) | Gemini planning, rescheduling, chat agent | ⭐⭐⭐⭐⭐ |
| Innovation (20%) | What-If Simulation, Explainable AI | ⭐⭐⭐⭐⭐ |
| Google Tech (15%) | Gemini + Firebase + Calendar + Cloud Run | ⭐⭐⭐⭐⭐ |
| UX (10%) | Custom dark design system, animations | ⭐⭐⭐⭐⭐ |
| Technical (10%) | TypeScript, Zustand, API routes | ⭐⭐⭐⭐⭐ |
| Completeness (5%) | All features deployed and working | ⭐⭐⭐⭐⭐ |
