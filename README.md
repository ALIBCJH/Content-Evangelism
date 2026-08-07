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
| `/search` | Search across published pieces |
| `/admin` | The posting desk |

`/articles`, `/about` and `/category/*` are permanent redirects to `/`;
they were removed when the site was cut down to the archive.

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
title, category, summary, body (blank line = paragraph, `## ` = subheading),
optional image URL, and the posting key. Published pieces appear at
`/articles/<slug>` and at the top of the archive on `/`.

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

One palette: the paper edition. Linen ground, cloth-white article
surfaces, navy chrome, gold as a rule rather than as paint. There is no
dark mode and no toggle — every colour in `globals.css` is the colour that
ships. The Oracle and Prophecy sections stay on navy; they are the paper's
reverent rooms, and they carry `on-navy` so gold reads bright there.

Gold has two values on purpose. `--gold` (#D4A017) is **paint** and only
sits on navy chrome. `--gold-ink` (#8A6410) is **ink** — the same hue
darkened until it clears 4.5:1 on linen — and `.text-gold` resolves to it
automatically. Never swap them.
