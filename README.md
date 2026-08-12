# Repent and Prepare the Way

The publication desk of the Ministry of Repentance and Holiness (headed by
Prophet Dr. David Owuor).

The site is deliberately one thing: **an archive of articles**. The landing
page (`/`) is the archive itself — the newest piece opens in place, and
everything published sits beneath it, grouped by month. Each piece has its
own page at `/articles/<slug>`. There is no homepage above the archive, no
section landing pages, and no marketing furniture; the reader arrives
already reading.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS 3 on the paper palette (linen ground, cloth articles, navy
  chrome, gold as a rule) — see **Theming**
- Lucide icons, shadcn/ui-style primitives (`src/components/ui`)
- Fonts: Newsreader (masthead & headlines), Gentium Book Plus (running
  text), IBM Plex Sans (kickers, nav, UI chrome)

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

**Prototyping mode — the frontend runs alone.** The FastAPI backend in
`backend/` is currently unplugged: articles are read straight off disk from
`data/articles.json`, so `npm run dev` is the only process the site needs —
no Postgres, no API server, no `API_URL`. To re-attach the server later,
restore the `fetch` calls in `src/lib/posted.ts`; that module is the only
place the frontend talks to the store, so nothing else has to change.

Note: don't run `next dev` and `next build`/`next start` at the same time —
they share the `.next` directory and will corrupt each other. If you see
`Cannot find module './###.js'`, that's what happened: stop everything,
`rm -rf .next`, and start again.

## The routes

| Route | What it is |
| --- | --- |
| `/` | The archive — the whole site |
| `/articles/<slug>` | One article |
| `/topics/<slug>` | One section, e.g. `/topics/oracles` |
| `/authors/<id>` | A byline and everything under it |
| `/teachings`, `/prophecies`, `/about` | Coming Soon placards |
| `/search` | Search across published pieces |
| `/admin` | The posting desk |
| `/feed.xml`, `/sitemap.xml`, `/robots.txt` | For machines |

`/articles` is a permanent redirect to `/`, and `/category/*` redirects to
the matching `/topics/*`.

Topic and author pages exist only while something is actually filed under
them, and 404 otherwise — so the sitemap never advertises an empty page.
The three Coming Soon placards carry `noindex` and stay out of the
sitemap; delete the `robots` line in each page's metadata the day it
opens.

Everything reader-facing is statically cached and refreshed every five
minutes, and the posting desk revalidates on publish, so a new article is
live immediately.

## Where things live

- `src/lib/content.ts` — the content model plus site chrome (categories,
  channels, nav, `siteInfo`). Articles themselves live in the store, not
  here; the one exception is `crossArticle`, which has a hand-built page.
- `src/components/article-art.tsx` — the "illuminated plate" generator: a
  piece published without a photograph gets deterministic art (palette +
  emblem + halo rings) instead.
- `src/components/archive/*` — the Articles archive: `opener.tsx` (the
  newest piece, opened in place and faded out into one Read button) and
  `archive-months.tsx` (months down the left, pieces down the right).
- `src/app/globals.css` — the theme tokens plus editorial primitives
  (kicker, drop cap, column rules, ornament, verse, excerpt, reveal).

## The light CMS backend

Articles can be posted from the browser at **`/admin`** ("The Posting Desk") —
title, category, summary, body, an optional image (with a description of
what it shows, which is required once an image is set), and the posting
key. Published pieces appear at `/articles/<slug>` and at the top of the
archive on `/`.

The body is plain text with a small grammar (`src/lib/article-body.ts`):

```
Blank line separates paragraphs.

## A subheading

> Quoted Scripture, one or more lines
> — Isaiah 40:3

- a bullet          1. or a numbered item

Link a phrase with [the cross](/articles/the-cross-of-jesus),
and emphasise with *italic* or **bold**.
```

API (same deployment, Next.js route handlers):

- `GET  /api/articles` — list posted articles (public)
- `POST /api/articles` — create; requires `Authorization: Bearer <ADMIN_TOKEN>`
- `GET  /api/articles/:slug` — single article (public)
- `DELETE /api/articles/:slug` — remove; requires the same bearer token

Storage is auto-detected in `src/lib/posted.ts`:

- **Local development** — a JSON file at `data/articles.json` (created on
  first publish; gitignored).
- **Vercel** — attach an **Upstash Redis / KV** store to the project
  (Storage tab → Create → Upstash Redis). Vercel injects
  `KV_REST_API_URL` and `KV_REST_API_TOKEN`, and the store switches over
  automatically — no code or dependency changes.

### Deploying to Vercel

1. Push this folder to a Git repository and import it in Vercel
   (framework preset: Next.js — no extra config needed).
2. In Project → Settings → Environment Variables, set
   `ADMIN_TOKEN` to a strong secret. This is the posting key typed
   into `/admin`. (Locally it defaults to `change-me`.)
3. Attach an Upstash Redis store (Storage tab) so published articles
   persist across deployments.

## Search-engine configuration

All optional — each one is simply omitted when unset, because a guessed
handle or an invented profile URL points crawlers at an account the
ministry does not own.

| Variable | What it does |
| --- | --- |
| `GOOGLE_SITE_VERIFICATION` | The token from Search Console. Set this first — nothing else can be measured until the property is verified and the sitemap submitted. |
| `SOCIAL_PROFILES` | Comma-separated official profile URLs (Facebook, X, Instagram…). They join YouTube and the radio station in the Organization `sameAs` set, which is what ties this domain to the ministry as an entity. |
| `TWITTER_HANDLE` | Including the `@`. Fills `twitter:site` / `twitter:creator`. |
| `CONTACT_EMAIL` | Published as the Organization `contactPoint`. |
| `IMAGE_HOSTS` | Comma-separated hostnames the image optimizer may resize for (`cdn.example.com`, or `*.example.com`). Empty by default: every image the site ships is local, and an optimizer open to everything is a free resizing service for the whole internet. The posting desk rejects an unlisted host up front. |

Structured data lives in `src/app/layout.tsx` (Organization + WebSite),
`src/components/breadcrumbs.tsx`, `src/components/archive/archive-view.tsx`
(CollectionPage + ItemList), and each article and author page.

## Theming

One palette: the paper edition. Linen ground, cloth-white article
surfaces, navy chrome, gold as a rule rather than as paint. There is no
dark mode and no toggle — every colour in `globals.css` is the colour that
ships. The Oracle and Prophecy sections stay on navy; they are the paper's
reverent rooms, and they carry `on-navy` so gold reads bright there.

Gold has two values on purpose. `--gold` (#D4A017) is **paint** and only
sits on navy chrome. `--gold-ink` (#8A6410) is **ink** — the same hue
darkened until it clears 4.5:1 on linen — and `.text-gold` resolves to it
automatically. Never swap them.
