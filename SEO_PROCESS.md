# SEO Process — Zavestni Dogodki

> Last updated: May 2026  
> Based on: SEO/GEO Knowledge Hub (internal reference)  
> Production: https://zavestnidogodki.si

---

## Blog Post Creation Checklist

Use this checklist every time you add a new entry to `apps/web/src/content/blog-posts.ts`.

### Content Strategy (before writing)
- [ ] Target a question people ask Google/ChatGPT ("Kaj je X?", "Kako začeti z X?", "Zakaj iti na X?")
- [ ] Choose content type:
  - **Listicle** (10 razlogov…) → 2,000–3,000 words
  - **How-to** (Kako začeti z…) → 1,500–2,500 words
  - **Guide/Vodič** (Popoln vodič za…) → 3,000–5,000 words
- [ ] Pick 1 primary keyword (e.g. "breathwork v sloveniji") + 3–5 secondary keywords
- [ ] Map to one of the 10 categories: YOGA, MEDITATION, BREATHWORK, SOUND_BATH, CACAO_CEREMONY, RETREAT, WORKSHOP, DANCE, TANTRA, HEALING

### Title & Meta (in `blog-posts.ts`)
- [ ] **`title`**: Benefit-driven, keyword near start, 50–60 chars ideal
  - Formula: `[Keyword] za [Audience]: [Benefit/Hook]`
  - Example: `"Breathwork za začetnike: kako začeti z dihalnimi vajami"`
- [ ] **`description`**: 120–160 chars, includes keyword + CTA verb ("Odkrijte", "Naučite se", "Preberite")
  - Example: `"Breathwork je ena najučinkovitejših tehnik za zmanjšanje stresa. Vodič za začetnike 2026."`
- [ ] **`date`**: ISO format `YYYY-MM-DD`
- [ ] **`dateModified`**: Set to today's date when you substantially update the post
- [ ] **`readingTime`**: Estimate word count ÷ 200 (average reading speed)

### Content Structure (in `content` array)
- [ ] **First section** (no `heading`): 100–150 word intro with primary keyword in first 100 words
- [ ] **H2 sections** (`heading` field): Use question-based headers for AEO
  - Format: "Zakaj je X tako učinkovit?", "Kako deluje X?", "Za koga je X primeren?"
  - Aim for 4–8 sections
- [ ] Each section body: 200–400 words, direct and quotable answers
- [ ] Include at least one comparison or numbered list for AI citation optimization

### FAQ (in `faq` array)
- [ ] Minimum **5 FAQ items**, ideally 7–10
- [ ] Questions should be conversational ("Ali X res pomaga?", "Koliko stane X v Sloveniji?")
- [ ] Answers: 2–4 sentences, directly quotable by AI engines
- [ ] Always include:
  - One pricing question with specific EUR ranges for Slovenia
  - One "where to find" question → answer links back to Zavestni Dogodki
  - One "is it safe/suitable for beginners?" question

### Internal Links
- [ ] `relatedCategories`: Include 2–3 relevant categories (drives the CTA section)
- [ ] The page auto-generates: author bio link → /events, related posts, category CTAs
- [ ] When you have 5+ blog posts: manually add cross-links in `content[].body` using slugs

### After Publishing
- [ ] Re-deploy Vercel (auto on `git push`)
- [ ] Submit URL to Google Search Console: Index → URL inspection → Request indexing
- [ ] Share on Zavestni Dogodki Facebook group

---

## Event Page SEO (Auto-Generated)

Event pages are auto-generated from the database. The following fields drive SEO — ensure the scraper/AI enrichment sets them correctly.

### Required DB Fields for SEO
| Field | Purpose | Example |
|---|---|---|
| `titleSl` | Primary H1 and title tag | "Zvočna kopel z Tibetanskimi posodami" |
| `slug` | Clean URL | `zvocna-kopel-tibetanske-posode-ljubljana` |
| `descriptionEn` / `shortDescEn` | Meta description source | First 160 chars used |
| `category` | Title formula + schema | `SOUND_BATH` |
| `date` | Schema + title year | ISO datetime |
| `venue.city` | Title formula | "Ljubljana" |
| `venue.address` | PostalAddress schema | "Trubarjeva 5, Ljubljana" |
| `venue.lat` / `venue.lng` | GeoCoordinates schema | 46.049, 14.506 |
| `imageUrl` | OG image + Event schema image | https://... |
| `price` | Offer schema | 25 |
| `sourceUrl` | CTA link | https://facebook.com/... |
| `tags` | Event schema keywords | ["zvočna kopel", "tibet"] |

### Auto-Generated SEO on Event Pages
- **Title tag**: `[Event Name] — [Category] v [City] [Year]` (gets `| Zavestni Dogodki` from template)
- **Meta description**: `[Category] v [City], [Date]. [Short desc]. Oglej si podrobnosti in se prijavi!`
- **Event JSON-LD**: name, startDate, endDate, image, location (PostalAddress + GeoCoordinates), organizer, offers, eventStatus, eventAttendanceMode, inLanguage
- **FAQPage JSON-LD**: What to expect, benefits, location
- **BreadcrumbList JSON-LD**: Home → Events → Category → Event
- **Open Graph**: title, description, image (1200×630), locale sl_SI, publishedTime

### What You Can Improve Manually
- If scraper produces a generic title, edit `titleSl` in `/admin/events` before approving
- Ensure `slug` is human-readable (Prisma auto-slugifies from title — check it)
- Add venue coordinates via Google Maps → right-click → copy lat/lng → update in DB

---

## Category Page SEO (Auto-Generated)

Category pages at `/categories/[category]` are auto-generated. They already include:
- ✅ Keyword-rich H1: `[Category] v Sloveniji — Delavnice & Retreati 2026`
- ✅ Unique description per category (`CATEGORY_DESCRIPTIONS` in the page file)
- ✅ BreadcrumbList schema
- ✅ FAQPage schema with 3–4 Q&As per category (AEO optimization)
- ✅ FAQ rendered as `<details>/<summary>` accordion

**To add a new category**: update `CATEGORY_DESCRIPTIONS` and `CATEGORY_AEO_FAQ` in `apps/web/src/app/categories/[category]/page.tsx`.

---

## City Page SEO (`/eventi/[city]`)

City pages at `/eventi/[city]` provide local SEO coverage. Each city page should:
- [ ] H1: `Zavestni dogodki v [City] — Joga, Meditacija & Breathwork`
- [ ] Meta description mentions city + 3 category keywords
- [ ] BreadcrumbList: Home → Dogodki → [City]
- [ ] Add city to sitemap (check `apps/web/src/app/sitemap.ts`)

---

## Monthly SEO Maintenance Schedule

### Week 1 — Technical Health
- [ ] Check Core Web Vitals in [Google PageSpeed Insights](https://pagespeed.web.dev) for homepage + 2 event pages
  - Target: LCP < 2.5s, INP < 200ms, CLS < 0.1
- [ ] Open Google Search Console → Coverage tab → fix any Index errors
- [ ] Check for 404s in GSC (URL inspection on recently approved events)

### Week 2 — Analytics Review
- [ ] GA4: Check top landing pages, bounce rate, sessions by channel
- [ ] Set up / verify Key Events in GA4:
  - `event_click` — click on "Prijavi se" / FB link (add `gtag('event', 'event_click')` to relevant `<a>` tags)
  - `newsletter_signup` — NewsletterSignup form submit
  - `chat_open` — ChatWidget first open
  - `submit_form` — /submit page form submit
- [ ] Compare organic search traffic week-over-week

### Week 3 — Rankings & Keywords
- [ ] Search Google: `site:zavestnidogodki.si` — check how many pages are indexed
- [ ] Search Google: `joga delavnice slovenija`, `breathwork slovenija`, `meditacija tečaj` — check position
- [ ] Check if any events expired and are now returning 404 → add redirect or update sitemap

### Week 4 — Content & Planning
- [ ] Publish 1 new blog post (see checklist above)
- [ ] Review CATEGORY_AEO_FAQ for accuracy (prices change, update ranges annually)
- [ ] Plan next month's content: check what new event types are being submitted

---

## AEO (Answer Engine Optimization) — Key Rules

AI engines (ChatGPT, Perplexity, Gemini, Claude) cite content that is:
1. **Directly quotable** — short, factual, self-contained paragraphs
2. **Question-based** — H2/H3 headers phrased as questions
3. **Comprehensive** — answers the full question without requiring follow-up clicks
4. **Authoritative** — author bio, organization schema, citations from research

### Content Patterns That Get Cited
| Pattern | Citation Rate | Apply Where |
|---|---|---|
| Listicle (10 razlogov…) | 21.9% | Blog posts |
| Comprehensive guide (3,000+ words) | 18.5% | Blog posts |
| How-to with steps | 16.7% | Blog posts |
| FAQ with direct answers | 14.2% | Category pages, blog posts |

### AEO Checklist per Blog Post
- [ ] At least 3 H2 headers phrased as questions
- [ ] Each answer paragraph: 2–5 sentences, factual, citable standalone
- [ ] Include at least one comparison table or numbered list
- [ ] FAQ section: 5–10 items, direct answer in first sentence
- [ ] Mention specific numbers (prices, durations, research stats)

---

## SEO Title Formulas by Page Type

| Page | Formula | Max chars | Example |
|---|---|---|---|
| Blog post | `[Keyword]: [Hook]` + template `\| Zavestni Dogodki Blog` | 60 (absolute) | `Zvočna kopel: Popoln vodič za začetnike \| Zavestni Dogodki Blog` |
| Event | `[Event Name] — [Category] v [City] [Year]` + template | 65 total | `Yoga Nidra — Joga v Ljubljana 2026 \| Zavestni Dogodki` |
| Category | `[Category] v Sloveniji 2026 — Delavnice & Retreati` + template | 70 total | `Joga v Sloveniji 2026 — Delavnice & Retreati \| Zavestni Dogodki` |
| City | `Zavestni dogodki v [City] — Joga & Meditacija` + template | 70 total | `Zavestni dogodki v Ljubljana — Joga & Meditacija \| Zavestni Dogodki` |
| Blog listing | Absolute: `Blog — Joga, Meditacija & Breathwork Vodniki \| Zavestni Dogodki` | 65 | — |
| Homepage | Stays at layout default | — | `Zavestni Dogodki — Zavestni dogodki v Sloveniji` |

> **Important:** Blog post pages use `title: { absolute: "..." }` to bypass the parent layout template.  
> All other pages use plain `title: "..."` which gets `| Zavestni Dogodki` appended by the template.

---

## Meta Description Formulas

| Page | Formula | Chars |
|---|---|---|
| Blog post | `[What it is]. [Key benefit]. [CTA verb] [year].` | 120–155 |
| Event | `[Category] v [City], [Date]. [Short desc snippet]. Oglej si podrobnosti in se prijavi!` | 120–160 |
| Category | `Najdite [category] [modifiers] v Sloveniji. [2-3 keyword-rich benefits].` | 120–155 |

---

## Schema Markup Reference

### Already Implemented
- **Event** (event pages): name, startDate, endDate, image, location (PostalAddress + GeoCoordinates), organizer, offers, eventStatus, eventAttendanceMode, inLanguage, keywords
- **FAQPage** (event pages + category pages + blog posts)
- **BlogPosting** (blog posts): headline, description, datePublished, dateModified, author, publisher (with logo), mainEntityOfPage, wordCount
- **BreadcrumbList** (all pages)
- **Organization** (layout): name, url, logo, sameAs (Facebook group)
- **WebSite** (layout): SearchAction (sitelinks search box)

### To Add in Future
- **Person** schema for individual facilitators (when organizer accounts are added)
- **LocalBusiness** for yoga studios/venues that become repeat organizers
- **Review/AggregateRating** if/when event reviews are added

---

## Key Files

| What | File |
|---|---|
| Blog post data | `apps/web/src/content/blog-posts.ts` |
| Blog post page template | `apps/web/src/app/blog/[slug]/page.tsx` |
| Blog listing | `apps/web/src/app/blog/page.tsx` |
| Event page template | `apps/web/src/app/events/[slug]/page.tsx` |
| Category page template | `apps/web/src/app/categories/[category]/page.tsx` |
| City page template | `apps/web/src/app/eventi/[city]/page.tsx` |
| Site-wide metadata + schemas | `apps/web/src/app/layout.tsx` |
| Sitemap | `apps/web/src/app/sitemap.ts` |
| Robots | `apps/web/src/app/robots.ts` |
