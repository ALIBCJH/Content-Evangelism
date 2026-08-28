/*
 * The archive, kept for the journey.
 *
 * A reader saves three teachings on wifi, gets on a matatu, and opens the
 * site — and until now that gave them three names and a connection error,
 * because "save for later" saved a slug and nothing else. This is what
 * makes the name true.
 *
 * Three caches, because three things deserve different treatment:
 *
 *   shell   the build's own files, which are content-hashed and so may be
 *           served from the cache without asking
 *   pages   what the reader has actually opened, kept as a fallback for
 *           when the network is not there — plus the altars, put there at
 *           install whether they have opened it or not
 *   saved   the pieces they deliberately put aside, which are fetched at
 *           the moment they press Save rather than hoped for later
 *
 * The altars are the one page kept in advance. Everything else here is a
 * copy of something the reader chose; that page is a copy of something
 * they may need before they know to choose it — an address and a phone
 * number, wanted precisely when the signal is worst and least likely to
 * have been loaded first. One page holds every altar the ministry has
 * given us, so one request buys all of them.
 *
 * Written by hand rather than generated. It is ninety lines, it is the
 * only thing between a reader and a blank screen, and a build tool's
 * output is not something anybody here could read at three in the morning.
 */

const VERSION = 'v1'
const SHELL = `shell-${VERSION}`
const PAGES = `pages-${VERSION}`
const SAVED = `saved-${VERSION}`
const OFFLINE_URL = '/offline'
/* Kept at install, not on a visit. See the note above. */
const ALWAYS = ['/altars']
const MINE = [SHELL, PAGES, SAVED]

/* How long a page may spend trying the network before the cache answers
   instead.

   "Network first" is the right rule and it was not the whole rule. A
   phone with one bar does not fail — it hangs. The radio holds the
   request open for as long as the platform allows, which can be the
   better part of a minute, and for all of it the reader is looking at a
   blank screen with a perfectly good copy of the page sitting in a cache
   underneath them. That is the matatu this worker was written for.

   Three seconds is longer than a good connection needs and shorter than
   a bad one takes to admit defeat. The network is not cancelled when it
   expires; it is left running, and whatever it eventually returns is put
   in the cache for next time. */
const PATIENCE = 3000

/* The most pages the visited-pages cache may hold.

   It had no limit. Every navigation was written to it and nothing was
   ever removed, so on a phone with little room to spare the browser would
   eventually reclaim the origin — and eviction takes the whole origin,
   which means the SAVED cache goes with it. A reader who deliberately put
   six teachings aside for a journey would lose them to the eighty pages
   they merely passed through. Oldest out first, and SAVED is never
   touched by this. */
const PAGE_LIMIT = 40

/* What may be served from cache without a thought: everything under it is
   content-hashed by the build, so a stale copy is not a possibility. */
const IMMUTABLE = [/^\/_next\/static\//, /^\/images\//, /^\/logo\.png$/, /^\/icons\//]

/* Never the desk, never the counters, never an answer from the model. */
const NEVER = [/^\/admin/, /^\/api\//]

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL).then((cache) => cache.addAll([OFFLINE_URL])),
      /* Best effort, and deliberately not allowed to fail the install: a
         reader whose altars did not cache is a smaller failure than a
         reader left with no worker at all. The next online visit puts it
         in the cache anyway, by the ordinary route every page takes. */
      caches
        .open(PAGES)
        .then((cache) => cache.addAll(ALWAYS))
        .catch(() => undefined),
    ]).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => !MINE.includes(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  )
})

/**
 * Whether a page may be put in a cache at all.
 *
 * The same two tests the fetch handler applies, in a function, because the
 * message handler needs them too and did not have them: a `keep` for
 * /api/questions would have fetched the queue with the reader's cookies
 * and written every reader's name and email address to disk, where it
 * would outlive both the session and signing out.
 */
function isCacheable(href) {
  try {
    const url = new URL(href, self.location.origin)
    return url.origin === self.location.origin && !isForbidden(url.pathname)
  } catch {
    return false
  }
}

/** The pieces a reader put aside, fetched now so they are there later. */
self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data.type === 'keep' && typeof data.href === 'string' && isCacheable(data.href)) {
    event.waitUntil(
      caches.open(SAVED).then((cache) =>
        /* no-store on the way in, so what is kept is the piece as it is
           now rather than whatever the browser happened to be holding. */
        fetch(data.href, { cache: 'no-store' })
          .then((response) => (response.ok ? cache.put(data.href, response) : undefined))
          .catch(() => undefined)
      )
    )
  }
  if (data.type === 'release' && typeof data.href === 'string') {
    event.waitUntil(caches.open(SAVED).then((cache) => cache.delete(data.href)))
  }
})

function isImmutable(pathname) {
  return IMMUTABLE.some((shape) => shape.test(pathname))
}

function isForbidden(pathname) {
  return NEVER.some((shape) => shape.test(pathname))
}

/**
 * Keep the visited-pages cache under PAGE_LIMIT, oldest first.
 *
 * `cache.keys()` returns them in insertion order, and a page that is
 * visited again is deleted and re-put by `keep` below, so "oldest" here
 * means least recently visited rather than first ever seen.
 */
async function trim(cache) {
  const keys = await cache.keys()
  if (keys.length <= PAGE_LIMIT) return
  await Promise.all(keys.slice(0, keys.length - PAGE_LIMIT).map((key) => cache.delete(key)))
}

/** Put a page in the visited cache, at the young end of it. */
async function keep(request, response) {
  const cache = await caches.open(PAGES)
  /* Deleted first so a re-visit moves the entry to the end of the
     insertion order rather than leaving it where it was — without this
     the trim above would be first-in-first-out over the whole history
     and would evict the page a reader opens every day. */
  await cache.delete(request)
  await cache.put(request, response)
  await trim(cache)
}

/**
 * A real copy of this page held on the device: what the reader kept, then
 * what they have already seen. Undefined when there is neither.
 *
 * Deliberately does not fall through to the offline page. This is what the
 * patience timer consults, and the offline page is not an answer to "your
 * connection is slow" — it is an answer to "your connection is gone". A
 * timer that could return it would tell a reader on a working-but-sluggish
 * connection that they were offline.
 */
async function cachedCopy(request) {
  const saved = await caches.match(request, { cacheName: SAVED })
  if (saved) return saved
  return caches.match(request, { cacheName: PAGES })
}

/** The same, plus the page that explains itself — for when the network has
    actually failed rather than merely kept us waiting. */
async function fromCache(request) {
  return (await cachedCopy(request)) || (await caches.match(OFFLINE_URL)) || Response.error()
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isForbidden(url.pathname)) return

  /* A page. The network first, because a teaching may have been edited
     and a reader should have the edit — but only for as long as PATIENCE
     allows, after which the cache answers and the network is left to
     finish into it for next time. Then what they kept, what they have
     seen, and the offline page, in that order. */
  if (request.mode === 'navigate') {
    const network = fetch(request).then((response) => {
      if (response.ok) event.waitUntil(keep(request, response.clone()))
      return response
    })

    event.respondWith(
      new Promise((resolve) => {
        let settled = false
        const answer = (response) => {
          if (settled) return
          settled = true
          resolve(response)
        }

        const timer = setTimeout(() => {
          /* Only if there is a real copy to fall back to. With nothing
             cached, waiting on the network is still the reader's best
             chance — cutting it short would hand them the offline page
             while their connection was merely slow. */
          cachedCopy(request).then((hit) => {
            if (hit) answer(hit)
          })
        }, PATIENCE)

        network.then(
          (response) => {
            clearTimeout(timer)
            answer(response)
          },
          () => {
            clearTimeout(timer)
            fromCache(request).then(answer)
          }
        )
      })
    )
    return
  }

  if (isImmutable(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const copy = response.clone()
            caches.open(SHELL).then((cache) => cache.put(request, copy))
            return response
          })
      )
    )
    return
  }

  event.respondWith(fetch(request).catch(() => caches.match(request).then((hit) => hit || Response.error())))
})
