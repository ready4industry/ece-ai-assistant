# Vercel Deployment Guide — ECE Lab Pro

## Prerequisites

- Vercel account (vercel.com) — Hobby plan is sufficient
- Access to the GitHub repository (`ready4industry/ece-ai-assistant`)
- All API keys and service credentials listed below

---

## Step 1 — Import the Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Under **Import Git Repository**, find and select `ready4industry/ece-ai-assistant`
4. Leave the framework preset as **Next.js** (auto-detected)
5. Leave the root directory as `/`
6. Do **not** click Deploy yet — add environment variables first (Step 2)

---

## Step 2 — Add Environment Variables

In the project settings, open the **Environment Variables** tab and add every variable below.
Set each one for **Production**, **Preview**, and **Development** unless noted otherwise.

### Firebase (Client SDK — public values, safe to expose)

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → General → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | same |

### Firebase Admin SDK (server-only — never expose publicly)

| Variable | How to get it |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console → Project Settings → Service Accounts → Generate new private key → download JSON → paste the **entire JSON as a single line** (remove newlines) |

### Supabase

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same — the `anon public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | same — the `service_role` key (keep secret) |

### AI Providers

| Variable | Where to get the key |
|---|---|
| `GROQ_API_KEY` | console.groq.com |
| `GEMINI_API_KEY` | aistudio.google.com/apikey |
| `CEREBRAS_API_KEY` | cloud.cerebras.ai |
| `SAMBANOVA_API_KEY` | cloud.sambanova.ai |

### Upstash Redis (rate limiting)

| Variable | Where to find it |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Console → your database → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | same |

### Optional

| Variable | Default | Purpose |
|---|---|---|
| `RATE_LIMIT_PER_HOUR` | `40` | Max requests per user per hour |

---

## Step 3 — Deploy

Click **Deploy**. Vercel will build and deploy the app. The first build takes about 2–3 minutes.

Once complete, Vercel assigns a URL such as:
```
https://ece-ai-assistant-<hash>.vercel.app
```

You can also add a custom domain under **Settings → Domains**.

---

## Step 4 — Authorize the Vercel Domain in Firebase

Google sign-in will be blocked unless the Vercel domain is whitelisted.

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → **Authentication** → **Settings** → **Authorized domains**
3. Click **Add domain** and enter your Vercel URL (e.g. `ece-ai-assistant-xyz.vercel.app`)
4. If you add a custom domain later, add that here too

---

## Step 5 — Run the Supabase Migration

The database schema must be up to date before the app will function.

1. Go to your Supabase project → **SQL Editor**
2. Open and run each migration file in order from the `supabase/migrations/` directory:
   ```
   001_initial_schema.sql
   002_...
   003_...
   004_...
   005_...
   ```
3. Confirm the tables `users`, `queries`, `probes`, `probe_responses`, `syllabus_topics`, `sessions`, `scans` exist under **Table Editor**

---

## Step 6 — Seed the Syllabus

The intent classifier and Socratic probe engine rely on `syllabus_topics` being populated.

1. In Supabase SQL Editor, run the seed file:
   ```
   supabase/seed.sql
   ```
2. Verify rows appear in the `syllabus_topics` table

---

## Step 7 — Verify the Deployment

1. Open the Vercel URL in a browser
2. Sign in with a Google account
3. Ask a concept question (e.g. "Explain Kirchhoff's current law") — you should receive a Socratic probe or a full answer
4. Check **Vercel → Logs → Function Logs** if anything fails — errors from the API routes appear there in real time

---

## Redeploying After Code Changes

Vercel automatically redeploys every time a commit is pushed to the `main` branch. No manual steps are needed.

To trigger a manual redeploy (e.g. after updating an environment variable):
- Vercel Dashboard → your project → **Deployments** → **Redeploy** on the latest deployment

---

## Faculty Access

Faculty accounts are determined server-side by email allowlist.
To grant a new faculty member access:

1. Open `lib/faculty-emails.ts` (or wherever the allowlist is maintained)
2. Add their `@` email address
3. Commit and push to `main` — Vercel redeploys automatically

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Google sign-in blocked / redirect error | Vercel domain not in Firebase authorized domains | Add domain in Firebase → Authentication → Authorized domains |
| 401 Unauthorized on all API calls | `FIREBASE_SERVICE_ACCOUNT` env var missing or malformed | Paste the JSON as a single line with no newlines |
| 500 on `/api/generate` | Missing AI provider key | Check Vercel env vars; check Vercel function logs |
| Probe or query not saving to DB | Supabase migration not run | Run all migration files in Supabase SQL Editor |
| Rate limit errors immediately | `UPSTASH_REDIS_REST_URL` or token wrong | Verify both Upstash values; check Upstash dashboard |
| Blank page / build error | TypeScript error or missing dependency | Check Vercel → Deployments → build logs |
