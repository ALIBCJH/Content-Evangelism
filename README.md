# Repent and Prepare the Way

The publication desk of the Ministry of Repentance and Holiness (headed by
Prophet Dr. David Owuor).

The site holds two archives and the ministry's own account of itself. `/`
is the front page — the proclamation, the piece being led with, and the
vision and mission. `/articles` is the writing, newest first. `/prophecies`
is the prophetic record: every message with its original recording, held so
that a **source**, an **event**, and an **interpretation** of that event are
never printed as one another.

The whole design is transcribed from the Ministry Platform prototype —
see [`docs/design/ministry-platform.md`](docs/design/ministry-platform.md),
which is the source of truth for the type, the palette, and the geometry.
Where a component and that file disagree, the file is right.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS 3 on the paper palette (cream ground, raised card surfaces,
  navy chrome, gold as a rule) — see **Theming**
- Lucide icons, shadcn/ui-style primitives (`src/components/ui`)
- Fonts: Fraunces (headlines, standfirsts, pull quotes), Inter (running
  text and UI), JetBrains Mono (kickers, datelines, Scripture references)

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
| `/` | The front page — hero, the featured piece, vision and mission |
| `/articles` | The archive of writing, newest first |
| `/articles/<slug>` | One article |
| `/prophecies` | The prophecy archive, on a dated rail |
| `/prophecies/<id>` | One record: source, timeline, independent record, interpretation |
| `/teachings` | The teaching library, arranged by subject |
| `/about` | The ministry: what it works from, holds to, and where it meets |
| `/topics/<slug>` | One section, e.g. `/topics/oracles` |
| `/authors/<id>` | A byline and everything under it |
| `/questions` | Questions readers sent, answered in the open |
| `/questions/<slug>` | One question and the desk's answer, as a `QAPage` |
| `/search` | Search across everything, with content-type facets |
| `/admin` | The posting desk |
| `/feed.xml`, `/sitemap.xml`, `/robots.txt` | For machines |

`/category/*` redirects to the matching `/topics/*`.

Search is also a sheet over any page: press `/` anywhere, or the Search
button in the masthead. The index is built once per render of the reader
shell and handed to the client, so a keystroke is answered without a
request.

Topic and author pages exist only while something is actually filed under
them, and 404 otherwise — so the sitemap never advertises an empty page.
`/search` carries `noindex`: its result pages are thin, query-shaped
duplicates of the pages they list.

Everything reader-facing is statically cached and refreshed every five
minutes, and the posting desk revalidates on publish, so a new article is
live immediately.

## Where things live

- `src/lib/content.ts` — the content model plus site chrome (categories,
  channels, nav, `siteInfo`). Articles themselves live in the store, not
  here; the one exception is `crossArticle`, which has a hand-built page.
- `src/lib/prophecies.ts` — the prophecy archive: every record with its
  recording, publication date, timeline, and independent sources.
- `src/lib/scripture.ts` — pulls Scripture references out of a teaching's
  own text, so the chips on a card and the rail beside an article never
  drift from the prose they came from.
- `src/lib/search-docs.ts` / `search-index.ts` — the search document shape
  and the pure helpers over it (client-safe), and the server-only builder
  that reads the store. Keep them apart: importing the builder from a
  client component drags the filesystem store into the browser bundle.
- `src/components/archive/*` — the listing: `archive-view.tsx` (the band,
  the filters, the featured card, and the rail) and `article-row.tsx`.
- `src/app/globals.css` — the theme tokens plus editorial primitives
  (kicker, chip, scripture figure, ornament, rule heading, excerpt).

## The light CMS backend

Two desks, and two keys.

**`/admin` — the posting desk.** Writing, editing and submitting. Nothing
written here reaches a reader: a new teaching is created `pending` and
waits. Needs `ADMIN_TOKEN`.

**`/admin/questions` — the question queue.** Every question sent from the
box at the foot of a page, newest first. Any of them can also be answered
in the open: the desk writes the question as it should be published and
the answer under it, and that pair becomes a page at `/questions/<slug>`.
The reader's own words, their name and their address are never part of
it. The address is minted once from the question and kept, so rewording
does not break a link somebody shared, and taking a page down and putting
it back returns it to the same URL. Needs `ADMIN_TOKEN`.

**`/admin/review` — the review desk.** A senior reviewer reads a pending
teaching in full and approves it, sends it back with a reason, or removes
it. Approving puts it on the site and marks it verified. A live piece can
also be unpublished from here. Needs `REVIEW_TOKEN`, which falls back to
`ADMIN_TOKEN` when unset — so a ministry running the desk single-handed
is not left with a queue nobody can clear.

A teaching with no status is live. That is load-bearing rather than lazy:
everything written before there was a review step keeps its place on the
site and its indexed address.

Articles can be posted from the browser at **`/admin`** ("The Posting Desk") —
title, category, summary, body, an optional image (with a description of
what it shows, which is required once an image is set), and the posting
key. Published pieces appear at `/articles/<slug>` and at the head of the
archive on `/articles`.

The body is plain text with a small grammar (`src/lib/article-body.ts`):

```
Blank line separates paragraphs.

## A subheading

> Quoted Scripture, one or more lines
> — Isaiah 40:3

- a bullet          1. or a numbered item

Link a phrase with [the rapture](/articles/rapture-or-second-coming-what-is-the-difference),
and emphasise with *italic* or **bold**.

|+ An optional caption
| | The rapture | The second coming
| Who sees Him | Those who are His | Every eye (Rev 1:7)

::statement From the ministry's statement of faith
:: The rapture is the imminent, premillennial return of Christ…
:: — Ministry of Repentance and Holiness

@video 29PZpK0CKts | The title | Prophet Dr. David Edward Owuor | Watch · 20 seconds

@related what-is-the-rapture-of-the-church | what-is-repentance-and-holiness
```

`@related` sets two or three other teachings into the middle of this one,
named by slug and set as an aside where the tangent comes up — the way out
of a piece for a reader who will not reach the foot of it. A slug the site
no longer holds is dropped; if none of them resolve, nothing renders.

## Asking the archive

The panel at the corner of every reader page answers questions from what
this site has published, and only from that.

The site's own scorer cuts each teaching at its chapter headings and picks
the handful of passages that bear on the question; those passages, and
nothing else, go to Claude with instructions to answer from them, to cite
them, and to say when the archive does not cover something. The answer
streams back with the teachings it was drawn from underneath it.

Set `ANTHROPIC_API_KEY` to switch it on. Unset, the endpoint answers
`NOT_CONFIGURED` and the panel offers the search and the question box, as
it did before — nothing pretends to work.

What a question costs is bounded by construction: 300 characters in, six
passages of 1400 characters as context, 700 tokens out, eight questions per
address per ten minutes.

## What a reader gets

**Offline.** A service worker (`public/sw.js`, hand-written, no build step)
keeps three things: the build's own files, the pages a reader has opened,
and the teachings they saved — those fetched at the moment Save is pressed
rather than hoped for later. Registered in production only, so a rebuilt
dev server is never served from yesterday's cache. A reader whose browser
has no worker gets the site exactly as it was.

**Being told.** Set `NEXT_PUBLIC_WHATSAPP_CHANNEL` to the ministry's channel
invite and a "New teachings on WhatsApp" link appears at the foot of every
teaching and in the footer. Unset, nothing is offered. No addresses, no
consent to record, nothing to unsubscribe from at this end.

**Listening, and keeping.** Every teaching carries *Listen* and *Save*
under its standfirst. Listen is the browser's own voice (`src/lib/speech.ts`)
with a player pinned to the foot of the window; Save tells the worker to
fetch the teaching now, so it opens with no connection later and waits
under *Saved* in the archive. Both had been reachable only from the
archive's cards, which is not the page most readers arrive on.

**Reading the verse.** The archive is its own concordance: `scripture-index.ts`
collects every passage these teachings quote in full, so a reference in the
rail opens the words as this ministry set them out, naming the teaching they
came from. A reference nothing quotes still prints as a reference.

**Sending a passage.** Every chapter heading carries its own anchor as a
share — the phone's share sheet where there is one, the clipboard where
there is not.

## The public content API

Everything published here is also readable as JSON, for search engines, AI
agents and anyone writing against the archive. It is read-only, versioned,
and needs no key.

```
GET /api/v1                      what this is, and how to use it
GET /api/openapi.json            the OpenAPI 3.1 contract
GET /api/v1/articles             the writing; q, category, tag, author, from, to
GET /api/v1/articles/{slug}      one teaching in full
GET /api/v1/prophecies           the prophetic record
GET /api/v1/teachings            the recorded sermons
GET /api/v1/categories|tags|authors
GET /api/v1/search?q=…           one query across all three collections
```

Documentation for people is at `/docs/api`; the contract for machines is the
OpenAPI document, which every response links in a `service-desc` header.
The layer is thin on purpose — `src/lib/api/service.ts` reads through the
same modules the pages read through, so nothing here is a second copy of a
rule the website already applies.

Publishing stays where it was: behind `ADMIN_TOKEN`, on the unversioned
routes below, which `robots.txt` disallows and the specification does not
describe.

API (same deployment, Next.js route handlers):

- `GET  /api/articles` — list posted articles (public)
- `POST /api/articles` — create; requires `Authorization: Bearer <ADMIN_TOKEN>`
- `GET  /api/articles/:slug` — single article (public)
- `DELETE /api/articles/:slug` — remove; requires the same bearer token
- `POST /api/questions` — a reader asking something (public; honeypot and
  rate limited)
- `GET  /api/questions` — the queue, worked at `/admin/questions`; requires
  the bearer token
- `PATCH`/`DELETE /api/questions/:id` — move a question along the queue, or
  remove it; same bearer token

Storage is chosen in `src/lib/posted.ts` by what is in the environment:

- **Upstash Redis**, whenever the deployment carries REST credentials —
  either `KV_REST_API_URL` / `KV_REST_API_TOKEN` (what Vercel's own
  integration injects) or `UPSTASH_REDIS_REST_URL` /
  `UPSTASH_REDIS_REST_TOKEN` (what attaching Upstash directly gives you).
  Either pair works; both halves must be present or the file store is
  used instead.
- **A JSON file** at `data/articles.json` otherwise, created on first
  publish and gitignored, so `npm run dev` needs nothing but the repo.

Readers' questions follow the same pair in `src/lib/questions.ts`, under the
`questions` key or `data/questions.json`. Nothing about the sender is
stored beyond what they typed — no address, no user agent, no identifier —
and an email given for a reply is never published.

Both hold the identical document — the whole article array, newest first
— under the key `articles`, so moving between them is a copy-paste of one
JSON blob. Upstash is reached over plain HTTPS, so this costs no
dependency.

Underneath both sits `content/articles/`, which is not a store: it is the
set of teachings the repository itself carries, one JSON file each, and
the site reads them as well as the store. A slug held by the store wins,
so an edit made at the desk is what a reader gets; a slug only the
repository has is served from the file, keeping the `publishedAt` written
into it rather than being dated by the deploy. This is what makes a
deployment with no store attached — a fresh Vercel import, before Upstash
— serve the archive instead of the empty state. They are pulled into the
serverless bundle by `outputFileTracingIncludes` in `next.config.js`,
because a directory read at runtime is invisible to the bundler.

A piece the repository carries is removed by removing its file and
redeploying: `DELETE /api/articles/:slug` works on the store, and cannot
delete something that was never posted to one.

Publishing with no store attached fails cleanly with *"The article store
is not writable"* rather than appearing to succeed; reading is unaffected
and the site keeps serving its built-in pieces.

### Deploying to Vercel

1. Push this folder to a Git repository and import it in Vercel
   (framework preset: Next.js — no extra config needed).
2. In Project → Settings → Environment Variables, set
   `ADMIN_TOKEN` to a strong secret. This is the posting key typed
   into `/admin`. (Locally it defaults to `change-me`.)
3. Attach an Upstash Redis store (Storage tab → Create → Upstash Redis)
   and let it inject its variables into the project. This is what makes
   the posting desk able to save at all: Vercel's filesystem is
   read-only, so without a store the site serves fine but publishing
   returns an error.

## Search-engine configuration

All optional — each one is simply omitted when unset, because a guessed
handle or an invented profile URL points crawlers at an account the
ministry does not own.

| Variable | What it does |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | The address this deployment answers on, with no trailing slash. Every canonical tag, the sitemap, the feed, every Open Graph URL and every `@id` in the structured data is built from it. **Set this the moment the site gets a domain** — a deployment serving one address while declaring another tells Google the real page is elsewhere, and Google believes it. Unset, it falls back to `https://read.repentanceonline.com`, which is where the site is served from today — so a deployment nobody has configured still describes itself correctly. |
| `GOOGLE_SITE_VERIFICATION` | The token from Search Console. Set this first — nothing else can be measured until the property is verified and the sitemap submitted. |
| `SOCIAL_PROFILES` | Comma-separated official profile URLs (Facebook, X, Instagram…). They join YouTube and the radio station in the Organization `sameAs` set, which is what ties this domain to the ministry as an entity. |
| `TWITTER_HANDLE` | Including the `@`. Fills `twitter:site` / `twitter:creator`. |
| `CONTACT_EMAIL` | Published as the Organization `contactPoint`. |
| `IMAGE_HOSTS` | Comma-separated hostnames the image optimizer may resize for (`cdn.example.com`, or `*.example.com`). Empty by default: every image the site ships is local, and an optimizer open to everything is a free resizing service for the whole internet. The posting desk rejects an unlisted host up front. |

Structured data lives in `src/app/layout.tsx` (Organization + WebSite),
`src/components/breadcrumbs.tsx`, `src/components/archive/archive-view.tsx`
(CollectionPage + ItemList), and each article and author page.

## Theming

One palette, transcribed from the design. A warm paper ground (`#F7F4EC`),
raised surfaces for cards (`#FFFDF8`) and bands (`#FBF9F3`), navy chrome
(`#123B5D`), and gold (`#B8944A`) used as a rule, a chip, and an accent —
never as a field of paint except on the primary button. There is no dark
mode and no toggle: every colour in `globals.css` is the colour that ships.

Two golds. `--gold` (#B8944A) is the design's accent — rules, chips, the
button, and kicker-sized labels. `--gold-ink` (#7A5F1E) is the darker value
for gold text at reading size and on gold chips. Note that `--gold` on the
cream ground is a ~2.7:1 contrast; the design uses it for small mono labels,
so prefer `--gold-ink` for anything a reader has to *read* rather than
merely notice.

Token names from the previous theme (`linen`, `cloth`, `sand`, `thread`,
`sky`, `hairline`) are kept as aliases pointing at the new palette, so
nothing renders unstyled — but new work should use `ground` / `raised` /
`card` / `rule` / `chip`, `navy`, `gold`, `ink`.
