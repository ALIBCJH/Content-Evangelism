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
  const res = await fetch(`${base}/api/v1/articles?limit=100`)
  if (!res.ok) die(`Could not read the archive: ${res.status}`)
  const { data } = await res.json()
  const rows = await Promise.all(
    data.map(async (a) => {
      const one = await fetch(`${base}/api/articles/${a.slug}`)
      const held = one.ok ? (await one.json()).article : {}
      return { slug: a.slug, poster: held.imageUrl, crop: held.thumbnailUrl }
    })
  )
  const missing = rows.filter((r) => !r.poster)
  for (const r of rows) {
    const mark = r.poster ? (r.crop ? '✓ poster + crop' : '~ poster only') : '· none'
    console.log(`  ${mark.padEnd(16)} ${r.slug}`)
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

const got = await fetch(`${base}/api/articles/${slug}`)
if (!got.ok) die(`No teaching with that slug: ${slug} (${got.status})`)
const a = (await got.json()).article

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

/* Read it back rather than trusting the 200: the one thing that must not
   have happened is the teaching leaving the site. */
const back = await fetch(`${base}/api/articles/${slug}`)
/* A 404 here is the one outcome that matters: the public read refuses a
   teaching that is no longer on the site, so a missing answer *is* the
   answer. */
if (!back.ok) {
  die(
    `The teaching is no longer on the site after that edit (${back.status}).\n` +
      'Put it back from the review desk before attaching another.'
  )
}
const after = (await back.json()).article
const live = after.status !== 'pending'
console.log(`  ${slug}`)
console.log(`    poster   ${after.imageUrl}`)
console.log(`    crop     ${after.thumbnailUrl}`)
console.log(`    on site  ${live ? 'yes' : 'NO — put this right before doing another'}`)
console.log(`    verified ${after.verified ? 'yes' : 'no'}`)
if (!live) process.exit(1)
