# Agent Taskboard

A mobile-first PWA for managing AI coding agents through a chat-like interface. GitHub issues become conversations, comments become messages, and creating a new task creates a GitHub issue.

## What It Does

- **Wraps GitHub into a messaging UI** — issues and PRs become chat threads, making it easy to interact with AI agents on mobile
- **Plan-first workflow** — new tasks get a `planning` label, the agent posts a plan, you approve with one tap, and implementation begins
- **Dashboard surfaces what needs you** — blocked agents, PRs needing review, agent questions asking for input
- **All data lives in GitHub** — no database, no vendor lock-in. Every message is a comment, every conversation is an issue
- **PWA with push notifications** — install on your phone's home screen, get notified when agents finish work or need help

## How It Works

1. **Create a task** — pick a repo, describe the task. The app creates a GitHub issue with `@claude` and a `planning` label.
2. **Agent plans** — Claude analyzes the codebase and posts an implementation plan as a comment.
3. **Approve & implement** — tap "Approve Plan & Implement" to trigger the agent to start coding.
4. **Review** — the agent opens a PR. Dashboard shows it under "Needs Your Attention" with risk labels (`auto-merge`, `needs-review`, `blocked`).

This app is the UI companion to the [Automated Developer Framework](https://github.com/AdamCooke00/automated-developer-framework). Any repo using the framework's workflows can be tracked here — add it in Settings.

---

## Deployment Guide (Vercel + Upstash)

### Prerequisites

- Node.js 18+
- A [Vercel](https://vercel.com) account (free Hobby tier is sufficient)
- An [Upstash](https://upstash.com) account (free tier is sufficient — ~150 commands/month for typical personal use)
- A GitHub account

### Step 1 — Upstash Redis

Push subscriptions (for notifications) need to persist across serverless restarts. Upstash provides this with a free Redis database.

1. Go to [upstash.com](https://upstash.com) and sign up (free, no credit card)
2. Create a new Redis database:
   - Type: Redis
   - Region: pick the one closest to your Vercel deployment region
   - Eviction: **disabled** (subscriptions must persist, not be evicted like a cache)
   - Connection: **REST** (required for Vercel serverless — TCP requires persistent connections)
3. From the database dashboard, copy:
   - **REST URL** → used as `KV_REST_API_URL`
   - **REST Token** → used as `KV_REST_API_TOKEN`

### Step 2 — Generate Secrets

**VAPID keys** (for push notifications — generate once, save both values):
```bash
npx web-push generate-vapid-keys
```

**Session secret** (32+ character random string for encrypting session cookies):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Webhook secret** (random string used to verify GitHub webhook payloads):
```bash
node -e "console.log(require('crypto').randomBytes(20).toString('hex'))"
```

### Step 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project → import your fork of this repo
2. Vercel will detect Next.js automatically — no build settings to change
3. Before clicking Deploy, expand **Environment Variables** and add:

| Variable | Value | Notes |
|---|---|---|
| `KV_REST_API_URL` | Your Upstash REST URL | From Upstash dashboard |
| `KV_REST_API_TOKEN` | Your Upstash REST token | From Upstash dashboard |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public VAPID key | From Step 2 |
| `VAPID_PRIVATE_KEY` | Private VAPID key | From Step 2 |
| `SESSION_SECRET` | 32+ char random string | From Step 2 |
| `GITHUB_WEBHOOK_SECRET` | Random hex string | From Step 2 |
| `GITHUB_CLIENT_ID` | From GitHub OAuth App | Add after Step 4 |
| `GITHUB_CLIENT_SECRET` | From GitHub OAuth App | Add after Step 4 |

4. Click **Deploy** — you'll get a live URL (e.g. `agent-taskboard.vercel.app`)

> You can deploy without `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` first to get the URL, then add them and trigger a redeploy.

### Step 4 — GitHub OAuth App

The app uses GitHub OAuth so you can log in with your GitHub account.

1. Go to GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**
2. Fill in:
   - **Application name**: Agent Taskboard (or anything)
   - **Homepage URL**: `https://your-app.vercel.app`
   - **Authorization callback URL**: `https://your-app.vercel.app/api/auth/callback`
3. Click **Register application**
4. Copy the **Client ID**
5. Click **Generate a new client secret**, copy it immediately (only shown once)
6. Go back to Vercel → your project → Settings → Environment Variables
7. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
8. Go to Deployments → click the three dots on the latest deployment → **Redeploy**

### Step 5 — Configure GitHub Webhooks

For each repo you want to track in the taskboard, add a webhook so the app is notified of activity in real time.

1. Go to the repo on GitHub → Settings → Webhooks → **Add webhook**
2. Fill in:
   - **Payload URL**: `https://your-app.vercel.app/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: your `GITHUB_WEBHOOK_SECRET` value
   - **Which events?** → Select individual events:
     - Issues
     - Issue comments
     - Pull requests
     - Workflow runs
3. Click **Add webhook**

Repeat for each repo you want to track.

### Step 6 — Install on iPhone

Push notifications on iOS require the app to be installed as a PWA (home screen app). **iOS 16.4+ required. Safari only** — does not work in Chrome or Firefox on iOS.

1. Open **Safari** on your iPhone
2. Navigate to `https://your-app.vercel.app`
3. Log in with GitHub
4. Tap the **Share button** (box with arrow, bottom of screen)
5. Scroll down and tap **Add to Home Screen**
6. Tap **Add**
7. Open the app from your **home screen icon** (must open from here, not from Safari, for push notifications to work)
8. When prompted, allow notifications
9. Go to **Settings** → add the repos you want to track

You'll receive push notifications when:
- An agent asks a question and needs your input
- A PR is labeled `needs-review` or `blocked`
- A task (issue) is closed
- A workflow run fails

---

## Local Development

```bash
git clone https://github.com/AdamCooke00/agent-taskboard.git
cd agent-taskboard
npm install
cp .env.local.example .env.local
# Fill in .env.local with your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local development, `KV_REST_API_URL` and `KV_REST_API_TOKEN` are optional — push subscriptions fall back to an in-memory store. Notifications won't survive server restarts locally, but everything else works fine.

To test webhooks locally, use [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) to expose your local server, then point a GitHub webhook at the tunnel URL.

---

## Security Notes

- All GitHub API calls are proxied through Next.js API routes — your GitHub token is never exposed to the browser
- Session data is encrypted with `iron-session` using `SESSION_SECRET`
- Webhook payloads are verified with HMAC-SHA256 using `GITHUB_WEBHOOK_SECRET`
- Rotate secrets periodically: regenerate VAPID keys (re-subscribe from phone once), session secret (get logged out once), webhook secret (update both Vercel and GitHub webhook settings)

---

## Tech Stack

- **Next.js 14** (App Router) + **React 18**
- **TypeScript** strict mode
- **Tailwind CSS** + shadcn/ui patterns
- **SWR** for data fetching with polling
- **iron-session** for encrypted session cookies
- **Octokit** for GitHub API
- **web-push** + Service Worker for push notifications
- **Upstash Redis** for push subscription persistence
- Deployed on **Vercel**

## Scripts

```bash
npm run dev    # Start dev server at localhost:3000
npm run build  # Production build (includes TypeScript type checking)
npm run lint   # Run ESLint
```
