# FreeShelf Phase 2 — Test Checklist

Run `npm run dev` before starting. All tests below assume `http://localhost:3000` unless stated otherwise.

---

## 0. Pre-flight

| # | Check | Pass | Fail |
|---|-------|------|------|
| 0.1 | `npm run dev` starts without TypeScript errors or red console output | Clean compile | Red `Type error:` lines in terminal |
| 0.2 | `npm run build` completes (optional but catches more) | `✓ Compiled successfully` | Build errors listing broken imports |

If 0.1 fails, stop. Fix the TypeScript error shown in the terminal before continuing — they'll all cascade.

---

## 1. Phase 2A — Data Layer (CheapShark)

### 1.1 Homepage loads with real data

1. Open `http://localhost:3000`
2. Wait up to 15s on first load (live API fetch, no KV cache in dev)

| # | What to check | Pass | Fail |
|---|---------------|------|------|
| 1.1a | "Free Right Now" section has at least 1 deal card | Cards visible | "No deals found" empty state |
| 1.1b | "On Sale" section appears below the free section | Visible with orange flame icon | Missing entirely |
| 1.1c | Deal cards show a real game title and price (not "Unknown Game" or $0.00) | Normal titles + prices | Placeholder text |
| 1.1d | No "Mid-Sale" or "Reseller" / "Third-Party Stores" sections visible | Clean two-section layout | Extra sections still showing |
| 1.1e | Console has no `[CheapShark/free] Error:` lines | Clean | Error lines in browser console |

### 1.2 FilterBar

1. Open `http://localhost:3000`

| # | What to check | Pass | Fail |
|---|---------------|------|------|
| 1.2a | No "Genre" dropdown in the filter bar | Absent | Still shows "Genre" button |
| 1.2b | Platform tabs (All Platforms, Epic Games, Steam, GOG…) still present | Visible | Missing |
| 1.2c | Clicking "Steam" tab filters to only Steam deals | Cards show Steam badge | Cards still show all platforms |
| 1.2d | TYPE pills (Timed / Weekend / Permanent) still work | Filters deals on click | No effect |
| 1.2e | Sort dropdown still shows (Expiring Soon, Highest Value, etc.) | Visible and works | Missing |

### 1.3 Search page (CheapShark-backed)

1. Go to `http://localhost:3000/search`
2. Type "Elden Ring" (wait ~400ms for debounce)

| # | What to check | Pass | Fail |
|---|---------------|------|------|
| 1.3a | Autocomplete dropdown appears with game suggestions | Dropdown with titles | No dropdown |
| 1.3b | Click a suggestion → price panel loads | Panel with store rows | Error panel: "Could not load price data" |
| 1.3c | Price panel shows at least one store with a price | Store rows visible | "No current deals found" |
| 1.3d | Error copy says "cheapshark.com" not "isthereanydeal.com" | CheapShark text | ITAD text (old code still running) |
| 1.3e | "FREE NOW" badge appears if the game happens to be free | Badge shown | — (only applies if game is free, skip if not) |

---

## 2. Phase 2B — Game Detail Pages

### 2.1 Card links

1. On the homepage, look at any deal card that came from CheapShark (`cs-*` deal ID — you can't see this directly, but any non-Epic/GOG/itch card is CheapShark)

| # | What to check | Pass | Fail |
|---|---------------|------|------|
| 2.1a | Hovering over a CheapShark card body (not the button) shows a pointer cursor | Pointer | Default arrow cursor |
| 2.1b | "Compare prices across all stores →" text link appears below the "Claim Free" / "View Deal" button | Link visible | Link absent |
| 2.1c | Clicking the card body (not the button) navigates to `/game/[id]` | URL changes to `/game/12345` | Stays on homepage or 404 |
| 2.1d | Clicking "Claim Free" / "View Deal" button opens the external store in a new tab (not the game detail page) | New tab to store | Navigates to /game/[id] instead |
| 2.1e | Epic / GOG / itch cards do NOT have the "Compare prices" link | No link on these cards | Link appears on all cards |

### 2.2 Game detail page

1. Navigate to `/game/[id]` (click a CheapShark card, or use the link from 2.1c)

| # | What to check | Pass | Fail |
|---|---------------|------|------|
| 2.2a | Page renders without 404 or blank white screen | Content visible | 404 or error page |
| 2.2b | Game title appears in the hero card | Title shown | "Unknown Game" |
| 2.2c | Cover image loads (Steam capsule art) | Image visible | Broken image icon |
| 2.2d | At least one store row is shown in "All Stores" section | Store rows | "No current deals found" |
| 2.2e | Prices are non-zero numbers (e.g. "$4.99" or "FREE") | Real prices | "$0.00" or "NaN" everywhere |
| 2.2f | "Price Comparison" chart section appears (only when >1 store) | Horizontal bars | Missing |
| 2.2g | "All-time low" text shows a price and date | "All-time low: $X.XX (Month DD, YYYY)" | Missing or "NaN" |
| 2.2h | "Save" wishlist button is present in the hero card | Button visible | Missing |
| 2.2i | Clicking "Save" while signed in adds it to the wishlist (heart fills) | Heart turns red | No change |
| 2.2j | "← All Deals" back link navigates to homepage | Navigates | Dead link / 404 |
| 2.2k | Page title in browser tab matches the game name | Game name | "FreeShelf" or "undefined" |

### 2.3 OG image for game page

1. Visit `http://localhost:3000/api/og?title=Elden+Ring&image=https://cdn.akamai.steamstatic.com/steam/apps/1245620/capsule_616x353.jpg&free=true`

| # | What to check | Pass | Fail |
|---|---------------|------|------|
| 2.3a | Returns a 1200×630 image (not a JSON error) | Image renders in browser | JSON `{"error":...}` or blank |
| 2.3b | "FREE RIGHT NOW" green pill is visible | Green pill | Missing or wrong text |
| 2.3c | Cover art appears on the right side | Thumbnail visible | Missing |

---

## 3. Phase 2C — Notifications & Cron

### 3.1 Refresh cron

```
POST http://localhost:3000/api/cron/refresh
```
Easiest way: open a new terminal and run:
```bash
curl -X POST http://localhost:3000/api/cron/refresh
```
Or in PowerShell:
```powershell
Invoke-WebRequest -Method POST http://localhost:3000/api/cron/refresh | Select-Object -ExpandProperty Content
```

| # | What to check | Pass | Fail |
|---|---------------|------|------|
| 3.1a | Returns `{"ok":true, "free":N, "sale":N, ...}` | ok:true with positive numbers | `{"error":"Unauthorized"}` or 500 |
| 3.1b | `free` count is > 0 | Positive integer | 0 (data fetch failed) |
| 3.1c | `sale` count is > 0 | Positive integer | 0 |
| 3.1d | After calling refresh, homepage reloads faster (KV cache warm) | Noticeably faster | Same slow first load |
| 3.1e | Terminal shows `[CheapShark/free] N raw → N free deals` log lines | Log lines present | No output (fetcher not called) |

> **Note:** `CRON_SECRET` is not checked in development (no env var = open). In production it's secured.

### 3.2 Notify cron (requires Resend key + signed-in user with notify_email=true)

```bash
curl -X POST http://localhost:3000/api/cron/notify
```

| # | What to check | Pass | Fail |
|---|---------------|------|------|
| 3.2a | Returns a JSON body (not a 500 crash) | Any JSON response | HTML error page or 500 |
| 3.2b | If `RESEND_API_KEY` is not set: returns `{"ok":true, "skipped":"no_resend_key"}` | skipped message | Crash or 500 |
| 3.2c | If Resend key IS set and no users have notify_email=true: `{"ok":true, "sent":0}` | sent:0 | Error |
| 3.2d | Full end-to-end: turn on email alerts in `/wishlist`, wishlist a game that's currently free, run notify — email arrives | Email received | No email, or wrong game listed |

> **To test 3.2d fully:** sign in → go to `/wishlist` → click "Email alerts off" to enable → heart a game that's currently showing as FREE on the homepage → run the notify cron → check your inbox. Check the Resend dashboard if the email doesn't arrive.

---

## 4. Phase 2D — SEO & Polish

### 4.1 Sitemap

1. First run the refresh cron (3.1) to warm the KV cache
2. Visit `http://localhost:3000/sitemap.xml`

| # | What to check | Pass | Fail |
|---|---------------|------|------|
| 4.1a | Page returns XML (not a Next.js error page) | XML document | Error or blank |
| 4.1b | Contains `/platform/epic`, `/platform/steam` etc. | Present | Missing |
| 4.1c | Contains `/genre/action`, `/genre/rpg` etc. | Present | Missing |
| 4.1d | Contains at least one `/game/` entry | `<loc>.../game/12345</loc>` | No game entries (KV cold — run refresh first) |
| 4.1e | No duplicate `/game/` entries for the same ID | Each ID once | Same ID repeated |

### 4.2 Robots

1. Visit `http://localhost:3000/robots.txt`

| # | What to check | Pass | Fail |
|---|---------------|------|------|
| 4.2a | Returns plain text | Text | Error |
| 4.2b | `/game/` is listed under `Allow:` | Present | Missing or under Disallow |
| 4.2c | `/api/` is listed under `Disallow:` | Present | Missing |
| 4.2d | Sitemap URL at the bottom points to the right domain | `Sitemap: https://your-domain/sitemap.xml` | Wrong URL or missing |

---

## 5. Regression checks (things that must still work)

These existed before Phase 2 and must not be broken.

| # | What to check | Pass | Fail |
|---|---------------|------|------|
| 5.1 | `/platform/epic` page loads with Epic deals | Deals visible | 404 or empty |
| 5.2 | `/genre/action` page loads (may be empty if no action games are free right now) | Page renders | 404 |
| 5.3 | Wishlist page (`/wishlist`) shows sign-in prompt when not logged in | Prompt | Redirect loop or 404 |
| 5.4 | Wishlist page shows saved deals when signed in | Deals listed | Empty even with items saved |
| 5.5 | Wishlist heart button on deal cards toggles correctly | Fills/unfills | No change |
| 5.6 | Flash ticker (deals expiring in <24h) appears if any deals expire soon | Ticker visible | Missing (may not appear if none are expiring) |
| 5.7 | Theme toggle (sun/moon) switches light/dark mode | Mode switches | No effect |
| 5.8 | Header search filters deal cards in real time | Cards filter as you type | No filtering |
| 5.9 | "Expiring Soon", "Hot", "Trending", "All Deals" section tabs switch the visible grid | Grid changes | No effect |
| 5.10 | Mobile layout: nav bar doesn't overflow horizontally | Clean | Platform tabs push off-screen badly |

---

## 6. Production smoke test (after `git push`)

Run these after Vercel finishes deploying.

| # | What to check |
|---|---------------|
| 6.1 | `https://your-domain.com` loads with real deals (KV cache will be cold on first deploy — may take 10s) |
| 6.2 | `https://your-domain.com/api/cron/refresh` called with `Authorization: Bearer $CRON_SECRET` header returns `{"ok":true}` |
| 6.3 | Vercel dashboard → Cron Jobs tab shows `refresh` scheduled hourly and `notify` every 2h |
| 6.4 | `https://your-domain.com/sitemap.xml` has game entries (after first cron run) |
| 6.5 | Sharing a `/game/[id]` URL on a messaging app shows the correct game OG image preview |

---

## Quick diagnosis guide

| Symptom | Most likely cause | Fix |
|---------|-------------------|-----|
| Homepage shows 0 free deals | CheapShark rate-limited or network blocked | Check terminal for `[CheapShark/free] Error:` — wait 60s and reload |
| `/game/[id]` returns 404 | Deal ID is not a CheapShark deal (Epic/GOG deals have no game page) | Navigate to a CheapShark card — check the "Compare prices →" link exists first |
| `/game/[id]` loads but shows "Unknown Game" | CheapShark `/games?id=X` returned nothing | Check the gameID in the URL is a valid CheapShark ID (should be a 4–6 digit integer) |
| Search returns no results | ITAD was returning results before; now CheapShark search is used | Try a major title: "Hades", "Control", "GTA". CheapShark's index is smaller than ITAD's |
| Notify cron returns 500 | Supabase env vars missing | Check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` |
| Email not received | Resend key missing or Resend domain not verified | Check `RESEND_API_KEY` and Resend dashboard for send errors |
| Sitemap has no `/game/` entries | KV cache cold | Run `/api/cron/refresh` first, then reload sitemap |
| TypeScript error on `clerkClient` | Clerk v5+ async change | The new notify route already uses `await clerkClient()` — rebuild and restart dev server |
