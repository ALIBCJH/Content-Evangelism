# Security review — Repent and Prepare the Way

**Scope:** the whole repository at `3e15cbc` (`main`, clean tree) — the Next.js
app in `src/`, the service worker in `public/`, the unplugged FastAPI service in
`backend/`, dependencies, and deployment configuration.
**Date:** 25 August 2026.
**Method:** manual read of every authentication, authorisation, input-handling
and rendering path; `npm audit` for dependencies; one finding (H-1) confirmed by
running it against the real store rather than by reading alone.

**Status:** every finding below is fixed, except where the entry says otherwise.
C-1 is partly fixed and says why. Each fix is pinned by tests — `tests/edit-gate.test.ts`,
`tests/questions-gate.test.ts`, `tests/link-and-address.test.ts`,
`tests/desk-gate.test.ts` and `backend/tests/test_auth.py`.

Findings are ordered by severity. Each says what is wrong, where, what it costs,
and what closes it. A closing section records the things that were checked and
found sound, because a review that lists only faults reads as though nothing was
built well, and a great deal here was.

---

## Summary

| # | Severity | Finding | Outcome |
|---|----------|---------|---------|
| C-1 | **Critical** | Next.js 14.2.5 carries CVE-2025-29927 — the middleware that guards `/admin` can be bypassed by a header | Partly fixed — `next@^14.2.35` clears the critical; the residue needs Next 15 |
| H-1 | **High** | The posting key can rewrite any published, reviewed teaching; it stays live, stays `verified`, keeps the original byline | Fixed — such an edit returns the piece to the queue |
| H-2 | **High** | The posting key can publish, reword and take down public Q&A pages, and delete reader correspondence for good | Fixed — both need the review key |
| M-1 | **Medium** | Every registered writer can read every reader's question, name and email address | Fixed — the queue is reviewer-only |
| M-2 | **Medium** | A writer can edit another writer's drafts through the API | Fixed — 403 unless it is theirs, or they may review |
| M-3 | **Medium** | No Content-Security-Policy | Fixed, with a stated limit |
| L-1 | Low | `safeHref` admits protocol-relative links — a body link can point off-site | Fixed |
| L-2 | Low | The service worker's `keep` message caches paths its own `fetch` handler refuses | Fixed |
| L-3 | Low | Rate limits trust the first `X-Forwarded-For` entry | Fixed — one helper, reading the last entry |
| L-4 | Low | The FastAPI service defaults `ADMIN_TOKEN` to `change-me` and fails open | Fixed — no token, no writes |
| L-5 | Info | In-memory rate limits are per-instance on a serverless host (already acknowledged in code) | Left as accepted |
| L-6 | Info | `IMAGE_HOSTS=*` re-opens the image optimizer to the internet | Documented in the README |

---

## C-1 · Critical — Next.js 14.2.5: authorisation bypass in middleware  ·  **partly fixed**

**Where:** `package.json` (`"next": "14.2.5"`), and the gate it undermines,
`src/middleware.ts`.

`npm audit --omit=dev` returns **1 critical and 2 high** advisories, all
reachable from the pinned Next version. The one that matters here is
*Authorization Bypass in Next.js Middleware* (CVE-2025-29927, fixed in 14.2.25):
a crafted `x-middleware-subrequest` request header makes Next skip middleware
execution entirely.

`src/middleware.ts` is the *only* thing standing in front of `/admin`. It is
also the only place the reviewer-only rule on `/admin/review` is enforced
(`src/middleware.ts:51`). Skip the middleware and both are gone.

**What it actually costs today, stated honestly.** Less than it sounds, and for
a reason the codebase earned: every page under `/admin` is a client component
(`'use client'` on `page.tsx` in `admin/`, `admin/review/`, `admin/questions/`,
`admin/insight/`), none of them reads the store on the server, and every API
route re-checks the key it is given. So a bypass renders an empty desk whose
every fetch answers 401. The door is off its hinges; the drawers are still
locked. That is exactly the "second answer to a question already answered
correctly" the middleware's own comment describes, and it is what keeps this
from being a breach.

It is still critical, for two reasons. The advisory list also contains cache
poisoning, SSRF and DoS issues at high severity against this version. And the
mitigation is an accident of today's rendering strategy: the first server
component added under `/admin` that reads the queue turns this straight into a
data disclosure, with nothing in the diff to say so.

**Fixed, in part — and the remainder is named here rather than left implied.**
`next` is now `^14.2.35`, which clears CVE-2025-29927: the critical bypass is
gone, and `npm audit` no longer reports anything critical.

It does not clear the rest, and the original text of this section was wrong to
say it would. The remaining advisories against `next` — cache confusion, SSRF in
rewrites and Server Actions, several DoS conditions — are fixed only in
**15.5.21 and later**. The 14.x line no longer receives them. So the honest
position is:

- The critical, directly-exploitable-here issue is closed.
- The residue is a **Next 15 migration**, which is a breaking change (App Router
  `params` and `searchParams` become promises, and this app reads both
  synchronously in around twenty route and page files). That is its own piece of
  work with its own testing, and folding it into a security fix would make both
  harder to review.
- Most of the residue is also not reachable in the ordinary sense: this app runs
  no Server Actions, has no custom server, no rewrites, and no WebSocket upgrade
  path. The cache-confusion issues are the ones that would matter, and they
  matter more once traffic grows.

**Recommended next step, separately:** plan the 14 → 15 upgrade. Until then
`npm audit --omit=dev` reports 3 high and no critical, all in that residue.

---

## H-1 · High — the posting key can rewrite a published teaching  ·  **fixed**

**Where:** `src/lib/posted.ts:524` (`updatePostedArticle`), specifically the
check at `src/lib/posted.ts:529`:

```ts
if (!authorized(token)) return { status: 401, error: 'Invalid posting key.' }
```

`authorized` is satisfied by the posting key. Nothing below it asks whether the
piece is live, and nothing resets its status.

**Why this is the important one.** Commit `ad67a4e` (#118) set the rule this
site is built on — *nothing goes on the site until somebody senior says so* —
and `3e15cbc` (#142) added the attestation that says who wrote a piece.
Both are defeated by a PUT.

`deletePostedArticle` gets this exactly right two hundred lines further down:

```ts
if (isLive(standing) && !canReview(token)) return 403   // src/lib/posted.ts:621
```

with a comment explaining that *taking something off the site is deciding*, so
it needs the review key. Replacing the entire body of something on the site is
at least as much a decision, and it is not checked at all. The asymmetry looks
like an oversight when Delete was hardened, not a judgement.

**Confirmed by execution**, not by reading. Against a real store holding one
published, `verified` teaching bylined to another writer, `updatePostedArticle`
called with the *posting* key returned:

```
  status   = 200
  body     = ENTIRELY DIFFERENT TEXT NOBODY REVIEWED.
  status   = published        ← still on the site
  verified = true             ← still carrying the reviewed mark
  author   = Grace Wanjiru grace-wanjiru   ← still under her name
```

So a holder of the posting key — which is every writer on the register, since
`deskToken` hands a writer session the ministry's write key — can file something
innocuous, wait for approval, and then replace it with anything at all. It goes
live immediately (`revalidatePublished` is called on the way out), it carries the
`verified` badge that means a reviewer read it against the ministry's teaching,
and it is signed with somebody else's name.

**Fix.** Follow the rule the delete path already keeps. In
`updatePostedArticle`, after the article is found:

```ts
/* Editing a piece on the site is deciding what is on the site. Either the
   editor is senior enough to decide, or the edit sends it back to the queue
   for somebody who is. */
if (isLive(standing) && !canReview(token)) {
  article.status = 'pending'
  article.submittedAt = now
  delete article.verified
}
```

Returning it to the queue is better than a 403 here: a writer fixing their own
typo should not be refused outright, and the queue is where the ministry already
decides. Whichever is chosen, `verified` must not survive an edit made by
somebody who cannot grant it — a badge that says "a reviewer read this" must
only ever be set by a reviewer reading it.

---

## H-2 · High — the posting key publishes to the open site through the question box  ·  **fixed**

**Where:** `src/lib/questions.ts:343`

```ts
function authorized(token: string): boolean {
  return authorizedForDesk(token)      // either key
}
```

used by `updateQuestion` (`:353`) and `deleteQuestion` (`:404`).

`updateQuestion` with a `published` payload mints a slug and puts a question and
its answer on the public site at `/questions/<slug>`, then
`revalidateAnswers()` flushes the cache so it appears at once
(`src/app/api/questions/[id]/route.ts:73`). This is publishing under the
ministry's name, and it needs only the posting key.

Commit `05a8192` (#132) — *answers in the open* — put reader questions on the
public site. Commit `ad67a4e` (#118) said nothing goes on the site without a
senior reader. The second rule was never extended to cover the first feature.
Teachings go through a review board; answers to pastoral questions, which speak
for the ministry just as directly, go up on one key.

`deleteQuestion` on the same key is the other half: a writer can permanently
destroy a reader's message — including one nobody has answered — and the store
keeps no history.

**Fix.** Split the two authorities the way the article store does:

- `updateQuestion` — `status` and `note` (moving a question along the queue,
  jotting on it) stay at `authorizedForDesk`. A `published` payload, and
  `published: null` which takes a page down, require `canReview`.
- `deleteQuestion` — require `canReview`, matching `deletePostedArticle`'s rule
  that removal is a decision.

Then gate `/admin/questions` on the reviewer role in `src/middleware.ts`
alongside `/admin/review`, so the desk shows the buttons the key can actually
use.

---

## M-1 · Medium — every writer can read every reader's email address  ·  **fixed**

**Where:** `src/app/api/questions/route.ts:91` (`GET`) → `listQuestions` →
`authorized` = `authorizedForDesk` (`src/lib/questions.ts:343`).

`listQuestions` returns the whole store, and a `Question` carries `name`,
`email`, the reader's own words, and the path they were reading when it occurred
to them (`src/lib/questions.ts:62–81`). The module's own comment is precise
about what that is: *"these are people's words and sometimes their email
addresses."*

Because `deskToken` resolves a writer session to the ministry's write key, this
is open to **every person on the register**, not to the ministry's own two keys.
`src/middleware.ts` gates only `/admin/review` on the reviewer role, so
`/admin/questions` renders for any writer session too.

The material is not ordinary user data. `src/lib/questions.ts:11` describes the
box as somewhere a reader in trouble writes, and `src/components/pastoral-care.tsx`
sits beside it. A ministry that adds a dozen contributors has, without deciding
to, given a dozen people the correspondence of readers who wrote to the ministry.

Nothing about the design is careless — the email is never published, the
published shape carries no identity, and the store keeps no IP address. The gap
is only that "who may hold a desk key" grew from two ministry keys to a register
of people, and the question queue's answer to "who may read this" did not grow
with it.

**Fix.** Make the queue reviewer-only (`canReview` in `listQuestions`, and the
middleware gate above). If writers genuinely need to see questions in order to
answer them, give them the redacted shape — question text and path, without
`name` and `email` — and keep the identifying fields for the review desk.

---

## M-2 · Medium — a writer can edit another writer's drafts  ·  **fixed**

**Where:** `src/lib/posted.ts:524`. `updatePostedArticle` never calls `wroteIt`.

`GET /api/articles?mine=1` is carefully narrowed on the server, and the comment
explains why (`src/app/api/articles/route.ts:63–68`): a filter applied in the
browser is a page that was still *sent* everybody's drafts, including a
reviewer's private note back to the writer. That reasoning is right, and it
stops at the read path. The write path takes a slug and a key and asks nothing
about ownership, so a writer who guesses or is shown a slug can rewrite a
colleague's unpublished draft — including one sent back with a reviewer's note.

Distinct from H-1: that one is about the review gate on *live* pieces; this is
about ownership of pieces still in the queue. They want different fixes.

**Fix.** In `updatePostedArticle`, when the session is a writer rather than a
reviewer, require `wroteIt(standing, writer)`. This needs the writer's identity
threaded to the store — `deskToken` deliberately returns the ministry key and
loses the person — so pass the session alongside the token, or move the check up
into `src/app/api/articles/[slug]/route.ts` where `deskSession` is already
reachable. A reviewer must keep the ability to edit anybody's work; that is the
job.

---

## M-3 · Medium — no Content-Security-Policy  ·  **fixed, with a stated limit**

**Where:** `next.config.js:58–87`.

The header block is good — `nosniff`, `SAMEORIGIN`, a sane `Referrer-Policy`, a
locked `Permissions-Policy`, two-year HSTS with a written reason for not
preloading. Its own comment names the hole:

> *None of these is a substitute for a content security policy, which this site
> does not yet have and which is the one remaining hole worth naming.*

That is an honest note and it is still an open finding. The exposure is real
though not large: article bodies are parsed by a strict block grammar rather
than rendered as HTML (`src/lib/article-body.ts`), the only two
`dangerouslySetInnerHTML` uses are a hardened JSON-LD serialiser
(`src/components/json-ld.tsx:17`) and a fixed theme script, and no user input
reaches either. So there is no injection route today. A CSP is what makes that
survive the next component somebody adds — and it matters more than usual here
because the admin desk shares an origin with reader pages, so any script that
ever runs on a reader page runs with the desk's cookie in scope.

**Fixed, and honest about what it buys.** A policy is now sent on every
response from `next.config.js`. It is written without a nonce, deliberately: the
nonce-and-`strict-dynamic` recipe is stronger and cannot work here, because
these pages are statically generated and served from a cache for the length of
the revalidation window — a per-request nonce would not match the one baked into
the HTML being handed out, and pages would break intermittently, which is worse
than breaking outright.

So `script-src` keeps `'unsafe-inline'` for Next's own bootstrap. What the
policy does close is every other route out: no script may be *loaded* from
another host, `object-src 'none'` ends the plugin routes, `base-uri 'self'`
stops an injected `<base>` repointing every relative URL on the page, and
`form-action 'self'` stops a form being made to post the desk's fields
elsewhere. Those three are where a content injection on a page like this would
actually go, and none of them needs a nonce.

Verified against the built site rather than the config: the header is present on
every response, the archive and teachings pages render, YouTube embeds play, and
the console reports no violations.

The residual — `'unsafe-inline'` on scripts — is what a Next 15 upgrade would
let us remove, since 15 supports a nonce that survives the cache. One more
reason to plan that migration.

---

## L-1 · Low — `safeHref` admits protocol-relative links  ·  **fixed**

**Where:** `src/lib/article-body.ts:112`

```ts
function safeHref(href: string): string | null {
  if (href.startsWith('/') || href.startsWith('#')) return href
  return /^(https?:|mailto:)/i.test(href) ? href : null
}
```

`javascript:` is correctly refused. But `//evil.example` and `/\evil.example`
both start with `/`, and a browser reads both as another host — so
`[Read more](//evil.example)` in a teaching renders as a link that looks
site-relative in the source and leaves the site in the browser.

This exact trap is already understood elsewhere in the codebase.
`safeDeskReturn` guards against it explicitly, with a comment
(`src/lib/desk-session.ts:207–211`): *"`//evil.example` is a protocol-relative
URL — a browser reads it as another host — and it would pass a `startsWith('/')`
check without difficulty."* The knowledge is there; it did not reach this
function.

Low because bodies come from writers rather than readers. It still matters: a
compromised or departing writer's link outlives their key, the site's own
`feed.xml` republishes it (`src/app/feed.xml/route.ts:30`), and readers of a
ministry publication have every reason to trust a link inside a teaching.

**Fix:** one line, borrowed from the function that already gets it right.

```ts
if (href.startsWith('//') || href.startsWith('/\\')) return null
```

---

## L-2 · Low — the service worker caches what its own rules forbid  ·  **fixed**

**Where:** `public/sw.js:73` (the `message` handler) against `public/sw.js:45`
and `:99` (the `fetch` handler).

The `fetch` handler is careful: `GET` only, same origin only, and

```js
const NEVER = [/^\/admin/, /^\/api\//]
```

The `keep` message handler applies none of these. It takes `data.href` from any
same-origin page and does `fetch(href, {cache:'no-store'})` — with cookies, as
same-origin fetches carry them — then `cache.put`s the response into the `saved`
cache, which is on disk and outlives both the 12-hour session and signing out.

So `postMessage({type:'keep', href:'/api/questions'})` from any script on the
origin writes the entire question queue — reader names, emails, pastoral
messages — to persistent disk storage under the reader's profile, where it stays
after the session dies.

Low, because it needs script execution on the origin, and M-3 is what makes that
unlikely. It is worth fixing anyway: it is a stated rule that one code path
keeps and another does not, and closing it costs a line.

**Fix:** in the `keep` branch, resolve the href against `self.location.origin`
and refuse it unless it is same-origin and passes `isForbidden`, the same two
tests the `fetch` handler already applies.

---

## L-3 · Low — rate limits trust the first `X-Forwarded-For` entry  ·  **fixed**

**Where:** three identical copies — `src/app/api/ask/route.ts:50`,
`src/app/api/questions/route.ts:52`, `src/app/api/insight/route.ts:47`.

```js
const forwarded = request.headers.get('x-forwarded-for') ?? ''
return forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
```

**On Vercel, where this site is deployed, this is correct** — Vercel's proxy
replaces any client-supplied `X-Forwarded-For` with the real client address, so
the first entry is trustworthy. Recorded as a footgun rather than a live bug.

It stops being correct the moment the app sits behind a proxy that *appends*
rather than replaces, which is the normal convention and specifically what
Heroku does — and this repository carries `backend/Procfile`, `backend/app.json`
and Heroku-shaped configuration throughout `backend/app/config.py`. On such a
host the first entry is whatever the caller typed, and every limit here is
bypassed by varying one header: `/api/ask` most expensively, since past it sits
a metered Claude call.

**Fix:** move the three copies into one `addressOf` helper, take the *last*
entry rather than the first when a trusted-proxy-count is configured, and write
down which host the assumption is for. A one-line comment naming Vercel would
have been enough to make this safe to move.

---

## L-4 · Low — the FastAPI service defaults its admin token to `change-me`  ·  **fixed**

**Where:** `backend/app/config.py:64`

```python
admin_token: str = "change-me"
```

`backend/app/auth.py:10` compares the `Authorization` header against
`f"Bearer {settings.admin_token}"`. With `ADMIN_TOKEN` unset, the service
authenticates anybody who sends `Bearer change-me`, and every write endpoint in
`backend/app/routers/articles.py` — create, update, delete — is open. The
backend also has no draft or review state, so anything created there is public
at once.

This is the opposite of the choice made on the Next side, which is emphatic
about it (`src/lib/posted.ts:402–404`): *"Unset means writes are closed — a
missing secret must never mean 'allow everyone'."* That is the right instinct
and the backend does not share it.

Mitigating: the service is unplugged (`src/lib/posted.ts:20` — *"The FastAPI
service in `backend/` is unplugged"*), and `backend/app.json` declares
`"generator": "secret"` for `ADMIN_TOKEN`, so a Heroku button deploy gets a
random value. What inherits the default is a `docker-compose` run, a manual
deploy, or any host that does not read `app.json` — and `backend/.env.example`
ships the literal string `ADMIN_TOKEN=change-me` for someone to copy.

**Fix:**

```python
admin_token: str = ""
```

and refuse in `require_admin` when it is empty, matching the frontend's rule.
Change `.env.example` to a blank value with the `openssl rand -hex 32` hint it
already carries alongside.

Also worth a look before this is ever plugged in: `backend/app/main.py:35`
combines a configurable origin list with `allow_methods=["*"]` and
`allow_headers=["*"]`. Harmless as it stands — credentials are not allowed, so
no cookie rides along — but the day someone adds `allow_credentials=True` to fix
a login, a wildcard origin becomes a full cross-origin takeover of the API.

---

## L-5 · Informational — per-instance rate limits

All four limiters hold their state in a module-level `Map`. On a serverless host
each instance sees only its own traffic, so the effective limit is the configured
one multiplied by the number of live instances.

This is already written down at `src/app/api/questions/route.ts:29–34` — *"a
real weakness and an accepted one: this is a speed bump, and the desk can delete
what gets past it"* — and the reasoning for having no limit on the sign-in path
at `src/app/api/desk/session/route.ts:15–23` is sound: 32-byte random keys, a
deliberately slow scrypt on the writer path, and a counter that would lock the
ministry out on a bad evening without stopping anything.

Recorded so the acceptance is visible in one place, not because it needs
changing. If `/api/ask` costs become a concern, that one endpoint — the only one
with a metered call behind it — is the candidate for a shared counter in the
Upstash instance the deployment already has.

## L-6 · Informational — `IMAGE_HOSTS` wildcard  ·  **documented**

`src/lib/seo.ts:84` honours `**` and `*` as "any host". `next.config.js:12`
feeds the same variable to `images.remotePatterns`. Setting `IMAGE_HOSTS=**`
restores the exact configuration `next.config.js:1–11` documents as having been
removed — the image optimizer as a public resizing service for the internet, at
the ministry's expense.

Nothing sets it today. Worth a line in the README's environment table saying the
wildcards exist and should not be used, since the removal is explained in a
comment that whoever edits the env var will not be reading.

---

## Checked and found sound

Recorded deliberately. These are the paths where an attack would ordinarily
start, and each was tried and closed.

**Session and keys**
- The desk cookie carries a role, a writer id and an expiry under an HMAC — no
  secret rides in it, and editing `writer` to `reviewer` invalidates the
  signature (`src/lib/desk-session.ts`).
- The signing secret is derived from the desk keys, so rotating a key
  invalidates every session minted with it, with no second variable to remember.
  No `ADMIN_TOKEN` yields no secret, and the desk shuts rather than opening.
- Versioned payload (`v2`), five parts, strict field validation, expiry checked
  before the signature is computed.
- Constant-time comparison everywhere a secret is compared —
  `sameSignature` (Web Crypto side), `sameKey` and `sameHash` (`node:crypto`),
  each handling the length-mismatch case without leaking length.
- Writer keys are `id.secret`, stored as scrypt (N=16384) over a 16-byte random
  salt. The store holds nothing that opens the desk; a stolen backup is inert.
- `writerForKey` returns `null` identically for a malformed key, an unknown id,
  a wrong secret and a deactivated writer — four facts, one answer.
- Sign-in returns one message for every way of being wrong.

**CSRF and redirects**
- `SameSite=Lax` plus an independent `fromThisSite` check on every cookie-
  authenticated request; Bearer clients bypass neither, they simply never reach
  it. The reasoning for Lax over Strict is written down and correct.
- `safeDeskReturn` refuses protocol-relative and off-desk `from` values, and
  `/admin/login` routes the query parameter through it before it reaches the
  client (`src/app/admin/login/page.tsx:36`).

**Publication boundary**
- `listPostedArticles` and `getPostedArticle` both default to live-only, so the
  archive, the article page, search, the sitemap, the feed and the public v1 API
  all fail closed. `tests/review-workflow.test.ts` pins this from six directions.
- Deleting a live teaching requires the review key; a queued one does not
  (`tests/desk-permissions.test.ts`).
- `wroteIt` resolves attribution by id first and byline only as a fallback,
  which is the correct order and the one `3e15cbc` argued for.
- `PUT` strips `authorName` and `authorId` from the input before it reaches the
  store, so an edit cannot reassign authorship
  (`src/app/api/articles/[slug]/route.ts:48`).
- `attributionFor` never reads an id from the request body.

**Output encoding**
- `serializeJsonLd` escapes `<`, `>`, `&`, U+2028 and U+2029, so `</script>`
  cannot appear in the output whatever the data holds.
- `feed.xml` escapes every interpolated field and neutralises `]]>` inside the
  CDATA block — the breakout most feed generators miss.
- The body grammar emits structured nodes, never raw HTML; `escapeXml` covers
  all five entities.
- `dangerouslyAllowSVG: false` and `contentDispositionType: 'attachment'` on the
  image optimizer.

**Input validation**
- `validateInput` allowlists fields explicitly, so `status` and `verified`
  cannot be injected through a create or an edit — checked specifically.
- Image URLs must be `https://` or site-relative, and an `https://` host must be
  on the optimizer's allowlist.
- The insight endpoint accepts only paths matching a fixed set of shapes, click
  labels from a fixed list, heading ids matching the generator's own pattern,
  and bounded counts; it returns nothing, honours DNT and GPC, and refuses to
  count when either is set even though the client already declines to send.
- Public API parameters are bounded and refused by name rather than clamped
  (`src/lib/api/params.ts`).
- No dynamic `RegExp` built from user input; no `eval`, `new Function`, or
  child-process use anywhere in `src/`.
- No SSRF surface: every `fetch` in the app targets a fixed same-origin path.

**Secrets**
- `.env`, `.env.local` and `data/` are all in `.gitignore`, and
  `git log --all -- .env .env.local data/` is empty: nothing was ever committed
  and then removed. No key material, private key or cloud credential appears in
  any tracked file.
- The desk key never travels through JavaScript — it is presented once, exchanged
  for an `httpOnly` cookie, and the store is handed the ministry's key for the
  role rather than the writer's own.

**Tests** — 391 passing, with `tests/api/security.test.ts`,
`desk-gate.test.ts`, `desk-permissions.test.ts`, `desk-session.test.ts`,
`review-workflow.test.ts`, `backend-hardening.test.ts` and
`attribution.test.ts` already pinning much of the above.

---

## What was done, and what is left

Every finding above is closed except the part of C-1 that cannot be, and one
informational item deliberately left as it stands.

Closed in this branch:

- **C-1** — `next` upgraded to `^14.2.35`. CVE-2025-29927 is gone.
- **H-1 / M-2** — `updatePostedArticle` now knows who is editing. A writer edits
  their own work; a reviewer edits anybody's; an edit to something already on the
  site, by somebody who cannot approve, returns it to the queue and takes the
  `verified` mark with it.
- **H-2 / M-1** — the question queue is reviewer-only to read, to publish out of,
  and to delete from. Moving a question along the queue and noting on it stay at
  the posting desk. `/admin/questions` is gated in the middleware beside
  `/admin/review`, and the writing desk no longer offers doors a writer cannot
  open. A single-key deployment is unaffected, because `reviewKey()` still falls
  back to the posting key.
- **M-3** — a Content-Security-Policy on every response.
- **L-1**, **L-2**, **L-3**, **L-4** — as described in each section.
- **L-6** — written into the README's environment table, beside the new
  `TRUSTED_PROXY_HOPS`.

Left open, on purpose:

- **The Next 15 migration.** The remaining advisories are fixed only in 15.5.21+,
  and the upgrade is a breaking change across every route that reads `params` or
  `searchParams`. It also buys the nonce-based CSP that would let `'unsafe-inline'`
  come off `script-src`. Worth planning as its own piece of work.
- **L-5**, the per-instance rate limits. Already reasoned about in the code, and
  the reasoning still holds.

One observation worth keeping. Four of these — H-1, H-2, M-1, M-2 — were the same
mistake in four places: a rule this codebase states clearly and enforces in one
function, not applied in the function beside it. None of them needed a new idea,
only the existing rule carried one step further. That is the shape to watch for
in review, more than any particular endpoint.

## Operational note, unrelated to the code

The previous `SECURITY-REVIEW.md` at this path was **15,892 NUL bytes** — zeroed
out, not text, with no recoverable content. That is a filesystem-level
corruption, not an editing mistake, and it is consistent with the failing SSD in
this machine. Worth two things: keep this file committed rather than untracked
so a corruption is visible as a diff, and treat any other recently-written
untracked file in this repository as suspect until read.
