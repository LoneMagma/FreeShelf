# FreeShelf — Deployment Guide
### freeshelf.vercel.app

---

## Step 1 — Apply the final file patches

Drop the files from `freeshelf-predeploy.zip` into your project root,
then run the shell scripts from previous zips if you haven't already:

```bash
bash deploy-phase3.sh     # or manually copy files — all scripts are in previous zips
```

---

## Step 2 — Set environment variables in Vercel

Go to: **vercel.com → your project → Settings → Environment Variables**

Add every variable below. Set the Environment to **Production, Preview, Development** for all of them.

---

### 🔐 Clerk (Authentication)

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | clerk.com → Your app → API Keys → Publishable key |
| `CLERK_SECRET_KEY` | clerk.com → Your app → API Keys → Secret key |

---

### 🗄️ Supabase (Database — wishlist, preferences, notifications)

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | supabase.com → Project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | supabase.com → Project → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase.com → Project → Settings → API → service_role ⚠️ Keep secret |

---

### ⚡ Upstash Redis (KV Cache — deal data, prevents cold-start delays)

| Variable | Where to get it |
|---|---|
| `UPSTASH_REDIS_REST_URL` | console.upstash.com → Database → REST API → URL |
| `UPSTASH_REDIS_REST_TOKEN` | console.upstash.com → Database → REST API → Token |

---

### 📧 Resend (Email notifications)

| Variable | Where to get it |
|---|---|
| `RESEND_API_KEY` | resend.com → API Keys → Create API Key |
| `RESEND_FROM_EMAIL` | `FreeShelf <alerts@freeshelf.app>` (or your verified domain) |

> **Note:** You must verify your sending domain in Resend first. If you don't have a custom domain yet, use `onboarding@resend.dev` as the from address for testing.

---

### 🌐 Site URL

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://freeshelf.vercel.app` |

---

### 🔑 Cron Secret (Secures the hourly refresh endpoint)

| Variable | Value |
|---|---|
| `CRON_SECRET` | Any random string you choose — e.g. run `openssl rand -hex 32` in your terminal |

---

### 🎨 Icofy (Optional — user identicons)

**No API key required.** Icofy is a public, no-auth API.
The `NEXT_PUBLIC_ICOFY_API_KEY` variable from earlier is **not needed** — remove it if you added it.
Icofy works automatically as soon as the code is deployed.

---

## Step 3 — Verify Supabase schema is applied

If you haven't run the schema yet, open your Supabase project → SQL Editor and run `supabase-schema.sql`.

Tables needed:
- `wishlist`
- `user_preferences`
- `deal_history`
- `email_notifications_sent`
- `unsubscribe_tokens`

---

## Step 4 — Deploy via terminal

Make sure you have the Vercel CLI installed:

```bash
npm install -g vercel
```

Login (one time):
```bash
vercel login
```

Link your local project to the existing Vercel project (one time if not already linked):
```bash
vercel link
# → Select your existing "freeshelf" project when prompted
```

**Push to production:**
```bash
# Standard git deploy — Vercel auto-deploys on every push to main
git add -A
git commit -m "Phase 3: CheapShark + sale redesign + UI polish + production fixes"
git push origin main
```

Vercel will detect the push and deploy automatically. Watch it at:
```
vercel.com → freeshelf → Deployments
```

**Or force a direct deploy via CLI (bypasses git):**
```bash
vercel --prod
```

---

## Step 5 — Warm the KV cache immediately after deploy

The first page load after deploy will be slow (8–10s) until the cache is populated.
Run this immediately after the deploy finishes to fill the cache:

```bash
curl -X POST https://freeshelf.vercel.app/api/cron/trigger \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
```

Replace `YOUR_CRON_SECRET_HERE` with the value you set in Step 2.

You should see a response like:
```json
{"ok":true,"refresh":{"free":8,"heavy":42,"sale":15,"flash":2,"ms":4200}}
```

---

## Step 6 — Verify cron jobs are scheduled

Go to: **vercel.com → freeshelf → Settings → Crons**

You should see two scheduled jobs:
- `/api/cron/refresh` — every hour (`0 * * * *`)
- `/api/cron/notify` — every 2 hours (`0 */2 * * *`)

If they don't appear, make sure `vercel.json` (from the zip) is committed and deployed.

---

## Step 7 — Quick smoke test

Open https://freeshelf.vercel.app and verify:

| Check | Expected |
|---|---|
| Homepage loads | Deal cards visible, no blank page |
| Free games show | At least 2 (Epic giveaways) |
| Sale section shows | 70%+ Off and 30-69% Off tabs populated |
| Theme toggle | Starts in light mode, toggles to dark |
| Sign in works | Clerk modal opens |
| Wishlist saves | Heart toggles, persists after refresh |
| `/game/12345` works | Game detail page with store prices |
| `/search` works | Autocomplete returns results |
| `/sitemap.xml` has `/game/` entries | After first cron run |
| Identicons show | Pixel-art avatar next to user button when signed in |

---

## Troubleshooting

**"Cache cold" error on homepage**
→ Run Step 5 (trigger the refresh cron)

**Wishlist not saving**
→ Supabase env vars missing or schema not applied — check Step 2 and 3

**Email notifications not sending**
→ `RESEND_API_KEY` missing, or sending domain not verified in Resend dashboard

**Cron jobs not appearing in Vercel**
→ Confirm `vercel.json` is in the project root and was included in the deploy

**"Ending Soon" tab not appearing**
→ This is correct — the tab only appears when deals have real expiry dates (Epic giveaways do, CheapShark deals don't). With only CheapShark free deals, the tab is hidden and the view defaults to "All Deals".

**Icofy identicons not showing**
→ No action needed — icofy.vercel.app is public and requires no setup. If images don't appear, check browser network tab for the request to `icofy.vercel.app/api/icon/...`

---

## Environment variables — quick reference

Copy this into Vercel's bulk env editor (Settings → Environment Variables → Import .env):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=FreeShelf <alerts@freeshelf.app>
CRON_SECRET=your_random_secret_here
NEXT_PUBLIC_SITE_URL=https://freeshelf.vercel.app
```
