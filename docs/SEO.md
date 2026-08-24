# SEO Playbook — Repent and Prepare the Way

How this site gets found on Google (and in AI answers), what the platform
does automatically, and what only the writer can do. Written August 2026
against Google's current Search Essentials.

---

## 1. What the platform already does for every article

You never have to think about these — they are generated from the article
itself the moment it is published from the Posting Desk:

| Signal | Where it comes from |
|---|---|
| `<title>` + meta description | article title + dek |
| Canonical URL | `/articles/<slug>` (slugs auto-generated, lowercase, hyphenated, unique) |
| Open Graph + Twitter card | title, dek, category |
| Branded social preview image | generated navy/gold card with title + category (WhatsApp/FB/X/Slack/Discord all use it) |
| `Article` JSON-LD | headline, description, section, author, publisher, datePublished, dateModified, timeRequired, image |
| `BreadcrumbList` JSON-LD + visible trail | Home › Category › Title |
| Site-level `Organization` + `WebSite` + `SearchAction` graph | layout.tsx (with logo) |
| XML sitemap entry with `lastmod` | appears the moment an article posts; updates on edit |
| robots.txt | allows everything public, names 12 AI crawlers explicitly, blocks /admin and /api |
| Reading time | word count → `X min read` + `timeRequired` |
| Related articles | Read Next block on every article |
| Server rendering | full body is in the HTML before any JavaScript — the reading gate is visual only, crawlers see everything |
| noindex on non-content | admin desk and internal search results (`/search?q=…`) |

**2026 notes** (verified against current guidance):
- FAQ rich results were retired by Google in May 2026; our FAQPage markup
  on /about stays because AI answer engines still read it for context.
- The schema types that still matter are exactly what we emit:
  Organization and Article. Google's AI Mode uses this markup to verify
  claims and choose citations even when no visual rich result appears.
- We deliberately do NOT ship llms.txt: Google has said it does not use
  it, and measured AI-crawler fetch rates are ~0.1%. Our robots.txt
  welcome to named AI crawlers is the mechanism that actually works.

## 2. One-time setup (do these once, ~30 minutes)

### Google Search Console
1. Go to https://search.google.com/search-console → Add property →
   **URL prefix** → `https://read.repentanceonline.com/`.
2. It gives you a TXT record — add it in your DNS host, wait, Verify.
3. Sitemaps (left menu) → add `https://read.repentanceonline.com/sitemap.xml`.
4. For the first ~10 articles: URL Inspection → paste the article URL →
   **Request indexing**. This pulls new sites into the index days faster.
5. After 2–3 weeks, live in the **Performance** report: it shows the exact
   queries people typed, impressions, clicks, and average position.

### Bing Webmaster Tools
1. https://www.bing.com/webmasters → Add site → easiest path: **Import
   from Google Search Console** (one click, reuses the verification).
2. Submit the same sitemap URL. Bing also feeds ChatGPT search and
   DuckDuckGo, so this is worth the five minutes.

### After DNS verification, also confirm:
- `https://read.repentanceonline.com/robots.txt` loads and references the sitemap.
- Rich results test: https://search.google.com/test/rich-results on one
  article URL — should detect Article + Breadcrumb.

## 3. Writing so the articles get found (the part only you can do)

Google ranks *pages for queries*. A seeker types a question; the article
that most plainly answers it, from a source that demonstrably knows the
subject, wins. For the spirituality space:

**Title = the search, Dek = the promise.**
- The title should contain the phrase a person would actually type.
  "The Discipline of Waiting" is beautiful but nobody searches it.
  "The Discipline of Waiting: What the Bible Says About God's Timing"
  keeps the poetry AND catches "what does the Bible say about God's
  timing". Pattern: *[Editorial title]: [the searched question]*.
- The dek becomes the meta description — write it as the sentence that
  makes a seeker click: name the question, promise the answer, ≤160 chars.

**Use `## ` subheadings as questions.** The body parser turns `## ` lines
into H2s. Write them the way people search: "What does repentance
actually mean?", "How do I prepare for the coming of the Messiah?",
"Is fasting required for repentance?". Google lifts these into People
Also Ask and AI answers cite them directly.

**One question per article.** A 1,500-word piece that fully answers
"how to pray the hours" outranks a 5,000-word piece that touches ten
topics. The categories (Teachings/Prophecy/Oracles/Devotional/Doctrine/
Church History/Testimony) are your topic hubs — fill them steadily so
each category page becomes a deep shelf on its subject.

**Say the words seekers use, not only the words the church uses.**
Write "end times" alongside "eschatology"; "hearing God's voice"
alongside "prophetic utterance"; "how to repent" alongside "repentance
unto holiness". The article can teach the deeper vocabulary — but it
must contain the plain phrase to be found by it.

**Scripture references are searches.** "Isaiah 53:5 meaning" and
"1 Corinthians 1:18 explained" are high-intent queries. When an article
turns on a passage, put the reference in a `## ` subheading.

**Internal links.** When a new piece touches an older one, mention and
link it in the body. Read Next does this automatically at the foot, but
in-body links carry more weight.

**Cadence beats bursts.** Two solid articles a week, every week, teaches
Google the site is alive. The sitemap updates itself; consistency does
the rest.

**E-E-A-T for a ministry site**: keep bylines consistent, keep the About
page's account of the ministry current, and let the official channels
(YouTube, Jesus is Lord Radio) stay linked in the Organization graph —
Google cross-references these to establish that the site speaks for a
real ministry.

## 4. Measuring

- **Search Console Performance** — queries, clicks, position (the truth).
- **Bing Webmaster** — same for Bing/ChatGPT/DuckDuckGo.
- We deliberately ship no analytics JavaScript (GA4/Clarity) for now —
  the site stays fast and private. If richer analytics are wanted later,
  a privacy-light option (Plausible/Umami, one ~1KB script) is the fit;
  needs an account decision first.

## 5. Deliberately deferred (revisit when the desk needs them)

- **Tags + author pages + hierarchical categories** — needs data-model
  changes; today's 7 fixed categories are the topic hubs and one desk
  byline is the voice. Revisit when there are multiple named authors.
- **Draft → Review → Scheduled workflow** — backend statuses; today the
  desk publishes directly and drafts live in the editor's autosave.
- **Pre-publish SEO score in the desk** — worthwhile once writing volume
  grows; the validation that exists (title/dek/body minimums) already
  blocks the worst cases.
- **AI writing assistance in the desk** — separate feature decision.
