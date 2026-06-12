# Deploying Utsav City VMS (Free)

This puts a live, installable PWA on the internet at **no cost**, ready to demo.

**Architecture**
- **Frontend (the app)** → Vercel (free, static, instant HTTPS, installable as a PWA)
- **Backend (API)** → Render (free web service)
- **Database/Auth/Storage** → Supabase (free tier, already set up)

Total cost: **₹0**. Total time: about **20 minutes**.

---

## Step 0 — One-time prep

1. **Run the push-notifications migration** (if not done): Supabase → SQL Editor → paste and run `database/migrations/002_push_subscriptions.sql`.
2. **Create a GitHub account** (if you don't have one): https://github.com/signup

---

## Step 1 — Put the code on GitHub

From the project folder (`c:\V\BUSINESS\Big_Business\Utsav_City`), run these in a terminal:

```bash
git init
git add .
git commit -m "Utsav City VMS - production ready"
```

Then create an **empty private repo** on GitHub (no README), copy its URL, and run:

```bash
git remote add origin https://github.com/<your-username>/utsav-city-vms.git
git branch -M main
git push -u origin main
```

> Your secrets are safe: `.gitignore` excludes every `.env` file, so no keys get uploaded.

---

## Step 2 — Deploy the backend (Render)

1. Go to https://render.com → sign up with GitHub.
2. **New → Blueprint** → pick your `utsav-city-vms` repo → Render reads `render.yaml` and proposes the **utsav-vms-api** service. Click **Apply**.
3. When prompted, fill in the secret env vars (these come from your existing `backend/.env`):

   | Key | Value |
   |---|---|
   | `SUPABASE_URL` | your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** key |
   | `VAPID_PUBLIC_KEY` | from your `.env` |
   | `VAPID_PRIVATE_KEY` | from your `.env` |
   | `WEB_BASE_URL` | leave blank for now (fill in Step 4) |
   | `ALLOWED_ORIGINS` | leave blank for now (fill in Step 4) |

   (`JWT_SECRET` is auto-generated. Twilio keys are optional — leave blank to run without WhatsApp/SMS.)
4. Wait for the build to finish. Copy the live URL, e.g. **`https://utsav-vms-api.onrender.com`**.

> Free Render services sleep after 15 min idle and take ~50s to wake. **Open the URL once a few minutes before any demo** to warm it up.

---

## Step 3 — Deploy the frontend (Vercel)

1. Go to https://vercel.com → sign up with GitHub.
2. **Add New → Project** → import your repo.
3. Set **Root Directory** to `web`. (Framework auto-detects as Vite.)
4. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase **anon/public** key |
   | `VITE_API_URL` | the Render URL from Step 2, e.g. `https://utsav-vms-api.onrender.com` |
   | `VITE_VAPID_PUBLIC_KEY` | same public VAPID key |

5. Click **Deploy**. You'll get a URL like **`https://utsav-city.vercel.app`**.

---

## Step 4 — Connect the two (important)

Go back to **Render → utsav-vms-api → Environment** and set:

| Key | Value |
|---|---|
| `WEB_BASE_URL` | your Vercel URL, e.g. `https://utsav-city.vercel.app` |
| `ALLOWED_ORIGINS` | the same Vercel URL |

Save → Render redeploys automatically. Done.

---

## Step 5 — Add the demo users (manual)

In Supabase → **Authentication → Add user**, create accounts, then in **SQL Editor** assign roles and link records (template in the project README / earlier setup notes). For the demo you need at least:
- one **admin** (you),
- one **guard**,
- one **family_head** resident.

---

## Step 6 — Show it as an app

On the chairman's phone, open the Vercel URL in Chrome/Safari → **menu → "Add to Home Screen"**. It installs like a native app: full-screen, its own icon, push notifications. That's the "wow" moment.

---

## Custom domain (optional, later)

Both Vercel and Render let you attach a domain like `app.utsavcity.com` for free (you only pay for the domain name, ~₹800/year). Add it in each dashboard's **Domains** tab and point your DNS as instructed.

---

## Quick checklist

- [ ] Migration `002` run in Supabase
- [ ] Code pushed to GitHub (no `.env` committed)
- [ ] Render API live, URL copied
- [ ] Vercel app live with the 4 `VITE_` vars
- [ ] `WEB_BASE_URL` + `ALLOWED_ORIGINS` set on Render to the Vercel URL
- [ ] Admin + guard + resident users created
- [ ] Warmed up the API, installed on a phone
