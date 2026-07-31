# Repent and Prepare the Way

The publication desk of the Ministry of Repentance and Holiness (headed by
Prophet Dr. David Owuor) — a premium Christian knowledge platform for
teachings, prophecies, oracles, study guides, and devotionals.
Organized like a modern broadsheet newspaper (layout hierarchy inspired by
premium news sites), styled with the shared Altar brand: deep navy, sacred
gold, and the ministry's flagship blue.

## Stack

- Next.js 14 (App Router) + TypeScript — fully static homepage
- Tailwind CSS 3 with the Altar Reporting App design tokens (dark = candlelit
  navy edition, light = warm paper edition)
- Framer Motion (restrained editorial scroll reveals)
- Lucide icons, shadcn/ui-style primitives (`src/components/ui`)
- Fonts: Fraunces (masthead & headlines), Newsreader (deks & excerpts),
  Montserrat (kickers, nav, UI chrome — the Altar brand sans)

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

Note: don't run `next dev` and `next start` at the same time — they share
the `.next` directory and will corrupt each other.

## Where things live

- `src/lib/content.ts` — the whole editorial content model + seed content
  (articles, oracle, series, guides, prophecy record, authors, topics).
  Swap this file for your CMS/API layer; the components render its shapes.
- `src/components/article-art.tsx` — the "illuminated plate" generator.
  The site uses no stock photography: every piece gets deterministic art
  (palette + emblem icon + halo rings + grain) declared next to its content.
- `src/components/sections/*` — one file per homepage section, in page
  order: hero (broadsheet), featured oracle, latest teachings, today's
  verse, featured series, recent articles (+ topics rail), study guides,
  prophecy collection, voices (authors), newsletter.
- `src/app/globals.css` — the ported Altar theme tokens plus editorial
  primitives (kicker, drop cap, column rules, ornament divider, glass).
- `public/theme-init.js` — pre-paint theme bootstrap + JSON-LD injection
  (kept out of the React tree on purpose: inline JSON-LD gets HTML-escaped
  by React SSR and breaks hydration).

## The light CMS backend

Articles can be posted from the browser at **`/admin`** ("The Posting Desk") —
title, category, summary, body (blank line = paragraph, `## ` = subheading),
optional image URL, and the posting key. Published pieces appear at
`/articles/<slug>` and on the `/articles` index (the Articles nav link).

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

## Theming

Dark (default) is the candlelit navy edition; light is the paper edition.
The toggle in the top strip stores the choice in `localStorage` under
`herald-theme`. The Oracle and Prophecy sections intentionally stay dark
in both themes — they are the paper's reverent rooms.
