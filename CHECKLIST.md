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
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ❌ Missing | Google Analytics 4 |

---

## 🔍 SEO & GEO Status
*(Based on SEO Knowledge Hub — May 2026)*

### ✅ Already Implemented (in code)
- [x] **Event JSON-LD schema** — full `Event` type with name, dates, location (with GeoCoords), organizer, offers, keywords
- [x] **BreadcrumbList schema** — on event pages and category pages → enables rich SERP breadcrumbs
- [x] **Organization + WebSite schema** in layout — AI citation signal + Google SearchAction (sitelinks search box)
- [x] **Keyword-rich `<title>` tags** on event pages — format: `[Event] — [Category] v [City] [Year] | Zavestni Dogodki`
- [x] **Optimized meta descriptions** — include date, location, CTA, 120-160 chars
- [x] **Open Graph + Twitter Card** — full tags on event pages (image with dimensions, locale `sl_SI`, canonical URL)
- [x] **Canonical URLs** on event and category pages
- [x] **Category page SEO titles** — `"Yoga v Sloveniji 2026 — Delavnice & Retreati"`
- [x] **Category-specific meta descriptions** — keyword-rich, unique per category
- [x] **Sitemap** — event pages (priority 0.8) + category static pages `/categories/[cat]` (priority 0.7, replaces broken `?category=` params)
- [x] **robots.txt** — blocks `/admin`, `/admin-login`, `/api/`; allows all bots on public pages
- [x] **Image alt text** — `"{event title} — {category} v {city}"` format on event cards
- [x] **`lang="sl"`** on `<html>` element
- [x] **Responsive design** — mobile-first, touch-friendly

### ❌ Needs Action — High Priority

#### Google Business Profile (LOCAL SEO #1 priority)
- [ ] **Create/claim Google Business Profile** at business.google.com
  - Category: "Event Organization" or "Wellness Center"
  - Name: "Zavestni Dogodki"
  - Website: https://zavestnidogodki.si
  - Description: (750 chars, include: joga, meditacija, breathwork, retreat, Slovenija)
  - Post 1-2 events per week (6-8 weeks before each event)

#### Google Analytics 4 + Search Console (Measurement)
- [ ] **Set up GA4** — install via Google Tag Manager or add `gtag.js` to layout
  - Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to Vercel env vars
  - Define Key Events: event registration click, form submit, newsletter signup, chat open
- [ ] **Connect Google Search Console** — verify ownership, link to GA4
  - Add `google-site-verification` content to `layout.tsx` (field exists, currently empty)
  - Submit sitemap: `https://zavestnidogodki.si/sitemap.xml`

#### Schema — Missing Types
- [ ] **FAQPage schema** on event pages — the "Kaj te čaka" section qualifies; high AI citation rate (14.2%)
- [ ] **BlogPosting schema** — needed when blog is added

### ⚠️ Needs Action — Medium Priority

#### Local Citations (NAP consistency)
- [ ] Submit to **Eventbrite** (list Zavestni Dogodki as organizer)
- [ ] Submit to **Meetup.com** (create organization profile)
- [ ] Submit to **TripAdvisor Events** (for Slovenia)
- [ ] Local Slovenian event directories (e.g., kam.si, events.si)
- [ ] Use consistent NAP: "Zavestni Dogodki — zavestnidogodki.si"

#### Content / Blog (for topical authority + AI citations)
- [ ] **Create `/blog` section** — blog posts drive organic traffic and AI citations
  - Best formats: Listicles (21.9% AI citation rate), Guides (18.5%), How-To (16.7%)
  - Target content: "10 najboljših yoga retreatov v Sloveniji", "Kaj je zvočna kopel?", "Breathwork za začetnike"
  - Min. length: 1500+ words per post; include FAQ section at end
- [ ] **Location-specific landing pages** — e.g., `/eventi/ljubljana`, `/eventi/maribor` for GEO targeting
- [ ] **Evergreen category content** — add descriptive intro text to category pages (currently just event grid)

#### Link Building
- [ ] Guest posts on Slovenian wellness blogs (2-4 per quarter)
- [ ] Get listed on wellness directories (at least 5 authoritative sources)
- [ ] Partner with event organizers for cross-linking

### 📊 Monthly SEO Maintenance (Recurring)
- [ ] **Week 1** — Check Core Web Vitals (PageSpeed Insights), review Search Console indexing errors
- [ ] **Week 2** — GA4: top landing pages, bounce rate, conversion rate by page
- [ ] **Week 3** — Monitor keyword rankings, check backlink profile
- [ ] **Week 4** — Plan next month's content, respond to new reviews

### 🛠️ SEO Tools to Set Up (Free tier first)
| Tool | Cost | Priority | Purpose |
|---|---|---|---|
| Google Search Console | Free | 🔴 Now | Indexing, search queries, Core Web Vitals |
| Google Analytics 4 | Free | 🔴 Now | Traffic, conversions, AI channel tracking |
| Google PageSpeed Insights | Free | 🔴 Now | Core Web Vitals monitoring |
| Google Business Profile | Free | 🔴 Now | Local SEO, map listing |
| Semrush or Ahrefs | ~$99-120/mo | 🟡 Later | Keyword research, backlinks |
| SERPWatcher | ~$29/mo | 🟡 Later | Rank tracking |
