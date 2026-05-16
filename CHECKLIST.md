# Zavestni Dogodki — Status & Checklist

> Last updated: May 2026  
> Production: https://zavestni-dogodki.vercel.app

---

## 🟢 What's Working (Live & Deployed)

### Core App
- [x] **Events listing page** — filterable by category, city, region, free text search
- [x] **Event detail pages** — description, date/time, price, venue map (OpenStreetMap), share buttons
- [x] **Facebook event link banner** on detail page — big blue CTA linking to original FB post
- [x] **Organizer CTA sidebar** — links to organizer website / Instagram when no FB source
- [x] **Categories browse pages** — `/categories/[category]` (yoga, meditacija, dihanje…)
- [x] **Organizer profile pages** — `/organizers/[id]`
- [x] **Homepage** — hero, featured strip, event grid, quick-links block, newsletter signup
- [x] **Sponsored strip** — horizontal scroll of FEATURED events (shown on unfiltered page 1)
- [x] **Native ad injection** — every 6th card in the grid is a partner ad
- [x] **Event card design** — full-bleed photo, category badge, round facilitator avatar overlay
- [x] **No-image fallback** — branded gradient + botanical SVG when no photo

### Submission
- [x] **Submit form** `/submit` — organizers can submit events
- [x] **LAUNCH_PROMO mode ON** — all submissions are currently FREE (no Stripe charge)
  - `LAUNCH_PROMO = true` in both `apps/web/src/app/submit/page.tsx` and `apps/web/src/app/api/submit/route.ts`
- [x] **Submit success page** `/submit/success` — shows promo confirmation
- [x] **Stripe webhook handler** — ready for when promo ends (`/api/webhooks/stripe`)

### Admin Panel
- [x] **Admin dashboard** `/admin/events` — paginated table of all events
- [x] **Approve / Reject / Feature** buttons per event
- [x] **📘 FB share button** — manually share any approved/featured event to FB group
  - Shows "Deljeno" after success; shows preview text if `FB_ACCESS_TOKEN` not set
- [x] **Admin route protection** — `proxy.ts` (Next.js 16) blocks `/admin/*` without `ADMIN_SECRET` cookie/header

### AI & Chat
- [x] **AI chat widget** — floating green button (bottom-right), collapsible panel
  - Answers in Slovenian via Claude (haiku model, fast & cheap)
  - 4 quick-reply suggestions
  - Typing indicator, last 10 messages context
- [x] **AI event processing** — Claude enriches scraped posts (title SL/EN, description, category, price, dates)

### Infrastructure
- [x] **Vercel deployment** — auto-deploys on push to `main`
- [x] **Vercel cron jobs** — 2 scheduled jobs:
  - Daily at 07:00 UTC → `/api/webhooks/cron/daily` (scrape + process pipeline)
  - Weekly Sunday 09:00 UTC → `/api/webhooks/cron/weekly` (newsletter)
- [x] **Supabase PostgreSQL** — events, organizers, venues, pipeline runs, newsletter subs
- [x] **Prisma ORM** with direct + pooler URLs
- [x] **Resend email** — configured for transactional emails
- [x] **Beehiiv newsletter** — publish drafts via API
- [x] **Sitemap + robots.txt** — auto-generated

### Scraper & Pipeline
- [x] **Multi-group FB scraper** — currently active groups:
  - `Zavestni Dogodki Slovenija` (our own group, ID: 529182865647567)
  - `Zavestno življenje Slovenija` (ID: 1161382984212526)
- [x] **Deduplication** — skips posts already in DB
- [x] **Auto-approve** — events with AI confidence ≥ 82% auto-approved
- [x] **FB Group auto-share** in pipeline — after approval, posts to our FB group
  - ⚠️ **INACTIVE** — only runs when `FB_ACCESS_TOKEN` is set (see Pending below)
- [x] **Pipeline run logging** — each run saved to DB (tokens, cost, counts)

---

## 🟡 Pending — Needs Your Action

### 🔑 Facebook Access Token (BLOCKER for FB auto-posting)
- [ ] **Get `FB_ACCESS_TOKEN` from Facebook**
  1. Go to: https://developers.facebook.com/tools/explorer
  2. Select your Facebook App
  3. Add permission: `publish_to_groups`
  4. Click "Generate Access Token" and authorize
  5. Exchange for a **long-lived token** (60 days):
     ```
     GET https://graph.facebook.com/v21.0/oauth/access_token
       ?grant_type=fb_exchange_token
       &client_id=YOUR_APP_ID
       &client_secret=YOUR_APP_SECRET
       &fb_exchange_token=SHORT_LIVED_TOKEN
     ```
  6. Add to Vercel → zavestni-dogodki → Settings → Environment Variables:
     - Key: `FB_ACCESS_TOKEN` / Value: *(long-lived token)*
  - `FB_GROUP_ID=529182865647567` is already set ✅

### 📧 Email Domain Verification (BLOCKER for sending newsletters to any address)
- [ ] **Add DKIM/SPF records** for `zavestnidogodki.si` in your DNS (Vercel Domains or registrar)
  - Currently Resend can only send to the account owner's email
  - Go to resend.com → Domains → Add domain → follow DNS instructions
  - Then newsletter sends will work for all subscribers

### 💳 Stripe (when ready to charge for listings)
- [ ] **Set `LAUNCH_PROMO = false`** in:
  - `apps/web/src/app/submit/page.tsx`
  - `apps/web/src/app/api/submit/route.ts`
- [ ] Add Stripe env vars to Vercel: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Make sure Stripe webhook endpoint is registered: `https://zavestni-dogodki.vercel.app/api/webhooks/stripe`

### 🤖 Scraper (activate more groups)
- [ ] **Verify and activate additional FB groups** in `packages/scraper/src/groups.ts`:
  - `Yoga Ljubljana` — set `active: true` after verifying group URL works
  - `Meditacija Slovenija` — same
  - `Holistično Zdravje Slovenija` — same
  - `Ecstatic Dance Slovenia` — same

### 🔁 FB Token Renewal
- [ ] **Set a reminder to renew `FB_ACCESS_TOKEN`** every ~55 days
  - Long-lived tokens expire after 60 days
  - Or explore Page Access Tokens / System User tokens for non-expiring option

---

## 🔵 Nice-to-Have / Future Features

- [ ] **Real facilitator avatar photos** — currently curated Unsplash stock; ideally pulled from organizer FB profile or uploaded by organizer at submission
- [ ] **Organizer accounts** — let organizers log in, manage their events, upload avatar
- [ ] **Image from FB post** — scraper currently uses first image from post; could be improved with better image selection
- [ ] **Event reminder emails** — send subscribers a reminder 24h before events they bookmarked
- [ ] **Bookmark / save events** — user accounts or cookie-based
- [ ] **Map view** — show all events on a Slovenia map
- [ ] **Recurring events** — handle weekly yoga classes etc. without duplicates
- [ ] **Slovenian translations** — UI currently mixes SL/EN; full i18n pass
- [ ] **Mobile app / PWA** — add to homescreen, push notifications
- [ ] **Partner / advertiser dashboard** — self-serve native ad management
- [ ] **Analytics dashboard** for organizers — views, clicks on their events

---

## 📊 Current Environment Variables (Vercel)

| Variable | Status | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ Set | Supabase pooler |
| `DIRECT_URL` | ✅ Set | Supabase direct |
| `ANTHROPIC_API_KEY` | ✅ Set | Claude AI |
| `RESEND_API_KEY` | ✅ Set | Email sending |
| `ADMIN_SECRET` | ✅ Set | Admin panel auth |
| `CRON_SECRET` | ✅ Set | Cron job auth |
| `NEXT_PUBLIC_APP_URL` | ✅ Set | Public URL |
| `FB_GROUP_ID` | ✅ Set | `529182865647567` |
| `FB_ACCESS_TOKEN` | ❌ Missing | **Needed for FB posting** |
| `STRIPE_SECRET_KEY` | ❌ Missing | Needed when promo ends |
| `STRIPE_WEBHOOK_SECRET` | ❌ Missing | Needed when promo ends |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ Missing | Needed when promo ends |
