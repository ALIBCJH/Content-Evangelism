#!/usr/bin/env node
/**
 * Attach a poster and its listing crop to a teaching that is already on
 * the site.
 *
 * The desk can do this, and for one teaching the desk is the right place.
 * This is for the other case: a stack of artwork arriving at once, each
 * piece needing the same three fields set on a teaching whose body runs
 * to eleven thousand characters. Retyping any of that by hand is a way to
 * lose a paragraph.
 *
 * It reads the teaching exactly as it stands, adds the three image fields
 * and puts the rest back untouched — so the title, the body, the tags,
 * the byline and the status are the ones that were already there.
 *
 * **The review key, not the posting key.** An edit by anybody who cannot
 * approve sends a live teaching back into the queue and strips the mark
 * that says a reviewer read it — see `updatePostedArticle`. That is the
 * right rule and this is not an exception to it: attaching a picture with
 * the posting key would take fourteen teachings off the site.
 *
 *   DESK_KEY=… node scripts/attach-art.mjs list  https://…
 *   DESK_KEY=… node scripts/attach-art.mjs set   https://… <slug> <art> "<alt>"
 *
 * `<art>` is the basename in public/images/articles — `rapture-of-the-church`
 * for `rapture-of-the-church.webp` and `rapture-of-the-church-wide.webp`.
 */

const [mode, base, slug, art, alt] = process.argv.slice(2)
const key = process.env.DESK_KEY

function die(message) {
  console.error(message)
  process.exit(1)
}

if (!base) die('Usage: DESK_KEY=… node scripts/attach-art.mjs <list|set> <base-url> …')

/* ── list ─────────────────────────────────────────────────────────── */

if (mode === 'list') {
  /* The desk's own listing rather than the public one, and with the key
     where there is one: the teachings this is used to inspect are the
     ones without artwork, and those are the ones most likely to be off
     the site. A list that could not see them would report the job as
     finished the moment it was taken down. */
  const res = await fetch(`${base}/api/articles`, {
    headers: key ? { authorization: `Bearer ${key}` } : {},
  })
  if (!res.ok) die(`Could not read the archive: ${res.status}`)
  const { articles } = await res.json()
  const rows = articles.map((a) => ({
    slug: a.slug,
    poster: a.imageUrl,
    crop: a.thumbnailUrl,
    live: a.status !== 'pending',
  }))
  const missing = rows.filter((r) => !r.poster && !r.crop)
  for (const r of rows) {
    const mark = r.poster ? (r.crop ? '✓ poster + crop' : '~ poster only') : r.crop ? '~ crop only' : '· none'
    console.log(`  ${mark.padEnd(16)} ${(r.live ? 'live' : 'held').padEnd(5)} ${r.slug}`)
  }
  console.log(`\n  ${rows.length - missing.length} of ${rows.length} have artwork.`)
  process.exit(0)
}

/* ── set ──────────────────────────────────────────────────────────── */

if (mode !== 'set') die('First argument must be `list` or `set`.')
if (!key) die('Set DESK_KEY to the review key. The posting key would take the teaching off the site.')
if (!slug || !art || !alt) die('Usage: … set <base-url> <slug> <art-basename> "<alt text>"')

/* The key's own desk, before anything is written.
 *
 * The posting key is *authorized* to make this edit — it simply demotes
 * the teaching to the queue and strips its verified mark on the way, which
 * is the correct rule and a catastrophe applied to fourteen live pieces.
 * Checking afterwards is too late; the write has happened. So the key is
 * asked which desk it opens first, and a key that cannot approve is turned
 * away having changed nothing. */
const who = await fetch(`${base}/api/desk/session`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
  body: JSON.stringify({ key }),
})
if (!who.ok) die(`That key was not recognised by ${base}.`)
const role = (await who.json()).role
if (role !== 'reviewer') {
  die(
    `DESK_KEY opens the ${role} desk, not the review desk.\n` +
      'An edit by a key that cannot approve takes the teaching off the site\n' +
      'and strips its verified mark. Nothing has been changed.'
  )
}

/* Both files, before touching the teaching. Attaching a path that 404s
   would put a broken picture on a page that is currently fine. */
for (const suffix of ['', '-wide']) {
  const url = `${base}/images/articles/${art}${suffix}.webp`
  const head = await fetch(url, { method: 'HEAD' })
  if (!head.ok) die(`That image is not on the server yet: ${url} (${head.status})`)
}

/* With the key, because a teaching taken off the site for having no
   picture is exactly the teaching this script is most often pointed at,
   and without the key that read is the 404 a reader gets. */
const got = await fetch(`${base}/api/articles/${slug}`, {
  headers: { authorization: `Bearer ${key}` },
})
if (!got.ok) die(`No teaching with that slug: ${slug} (${got.status})`)
const a = (await got.json()).article
const wasLive = a.status !== 'pending'

const res = await fetch(`${base}/api/articles/${slug}`, {
  method: 'PUT',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
  body: JSON.stringify({
    title: a.title,
    dek: a.dek,
    category: a.category,
    body: a.body,
    tags: a.tags ?? [],
    imageUrl: `/images/articles/${art}.webp`,
    thumbnailUrl: `/images/articles/${art}-wide.webp`,
    imageAlt: alt,
  }),
})

if (!res.ok) die(`${res.status} ${await res.text()}`)

/* Read it back rather than trusting the 200, and with the key: a teaching
   held off the site for having no picture is exactly what this is pointed
   at, and a keyless read of one is the 404 a reader gets. */
const back = await fetch(`${base}/api/articles/${slug}`, {
  headers: { authorization: `Bearer ${key}` },
})
if (!back.ok) die(`Could not read ${slug} back after the edit (${back.status}).`)

const after = (await back.json()).article
const live = after.status !== 'pending'
/* The thing that must not have happened is the *edit* taking a teaching
   off the site. A piece that was already held — waiting for the picture
   this run just gave it — is not that, and saying so would turn the
   ordinary way back onto the site into an alarm. */
const tookItDown = wasLive && !live
console.log(`  ${slug}`)
console.log(`    poster   ${after.imageUrl}`)
console.log(`    crop     ${after.thumbnailUrl}`)
console.log(
  `    on site  ${
    live
      ? 'yes'
      : tookItDown
        ? 'NO — this edit took it off. Put it right before doing another'
        : 'not yet — approve it at the review desk'
  }`
)
console.log(`    verified ${after.verified ? 'yes' : 'no'}`)
if (tookItDown) process.exit(1)
