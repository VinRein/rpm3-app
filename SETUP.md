# RPM³ — Deployment Setup Guide

This guide gets your app running on Vercel (accessible on any device) with Supabase (cross-device data sync) and GitHub (version control). Takes about 20 minutes.

---

## Step 1 — GitHub (version control + deploy trigger)

**1a. Create a GitHub account** if you don't have one: https://github.com

**1b. Create a new repository:**
- Go to https://github.com/new
- Name: `rpm3-app`
- Keep it **Private**
- Don't add README or .gitignore (we already have them)
- Click **Create repository**

**1c. Push your code** — open Terminal, `cd` into the `rpm3-app` folder, then run:

```bash
cd ~/Claude/Projects/RPM3/rpm3-app
git init
git add -A
git commit -m "Initial commit — RPM³"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/rpm3-app.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

---

## Step 2 — Supabase (database + auth)

**2a. Create a Supabase account:** https://supabase.com (free)

**2b. Create a new project:**
- Click **New project**
- Name: `rpm3`
- Set a database password (save it somewhere safe)
- Region: choose the one closest to you
- Click **Create new project** — takes ~2 minutes

**2c. Run the database schema:**
- In your Supabase project, go to **SQL Editor** (left sidebar)
- Click **New query**
- Open the file `rpm3-app/supabase-schema.sql` and paste the entire contents
- Click **Run**
- You should see "Success. No rows returned."

**2d. Enable email magic link auth (already enabled by default):**
- Go to **Authentication** → **Providers**
- Confirm **Email** is enabled

**2e. Add your site URL (important for magic link redirects):**
- Go to **Authentication** → **URL Configuration**
- **Site URL**: set to your Vercel URL once you have it (e.g. `https://rpm3-app.vercel.app`) — update this after Step 3
- **Redirect URLs**: add `http://localhost:3000/auth/callback` (for local dev)

**2f. Get your API keys:**
- Go to **Settings** → **API**
- Copy the **Project URL** and **anon/public key**

---

## Step 3 — Environment variables (local)

Create a file called `.env.local` in the `rpm3-app` folder (copy from the example):

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

Test locally:
```bash
npm run dev
```

Open http://localhost:3000 — you should be redirected to the login page. Enter your email, get the magic link, sign in. Your data will now sync to Supabase.

---

## Step 4 — Vercel (deployment)

**4a. Create a Vercel account:** https://vercel.com (free, sign in with GitHub)

**4b. Import your repository:**
- Click **Add New → Project**
- Choose your `rpm3-app` GitHub repository
- Click **Import**

**4c. Add environment variables** before deploying:
- In the Vercel project setup, expand **Environment Variables**
- Add each of these:
  - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
  - `ANTHROPIC_API_KEY` → your Anthropic key (if you have one)
- Click **Deploy**

**4d. Get your production URL** (e.g. `https://rpm3-app.vercel.app`)

**4e. Update Supabase with your Vercel URL:**
- Go back to Supabase → **Authentication** → **URL Configuration**
- Set **Site URL** to `https://rpm3-app.vercel.app`
- Add to **Redirect URLs**: `https://rpm3-app.vercel.app/auth/callback`
- Save

---

## Step 5 — iPhone home screen

1. Open Safari on your iPhone
2. Go to your Vercel URL (e.g. `https://rpm3-app.vercel.app`)
3. Sign in with your email magic link
4. Tap the **Share** button (box with arrow)
5. Scroll down and tap **Add to Home Screen**
6. Name it **RPM³** → tap **Add**

The app now lives on your home screen, opens full-screen, and all your data syncs automatically between your Mac and iPhone.

---

## Updating the app

Whenever we make changes to the code:

```bash
cd ~/Claude/Projects/RPM3/rpm3-app
git add -A
git commit -m "Description of what changed"
git push
```

Vercel auto-deploys within ~60 seconds. No manual steps needed.

---

## Troubleshooting

**Magic link doesn't work / redirects to wrong URL:**
- Check Supabase Authentication → URL Configuration has your correct Vercel URL
- Make sure Redirect URLs includes `/auth/callback`

**"Invalid API key" error on login:**
- Double-check your `.env.local` values match Supabase Settings → API
- In Vercel: Settings → Environment Variables — re-check values there too

**Data not syncing:**
- Open browser DevTools → Console — look for `[sync]` errors
- Make sure the `user_data` table was created (Supabase → Table Editor)
