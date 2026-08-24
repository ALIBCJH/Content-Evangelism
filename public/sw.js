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

/** The pieces a reader put aside, fetched now so they are there later. */
self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data.type === 'keep' && typeof data.href === 'string') {
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

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isForbidden(url.pathname)) return

  /* A page. The network first, because a teaching may have been edited
     and a reader should have the edit; the cache when there is no
     network; and the offline page when there is neither. */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(PAGES).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(async () => {
          const saved = await caches.match(request, { cacheName: SAVED })
          if (saved) return saved
          const seen = await caches.match(request, { cacheName: PAGES })
          if (seen) return seen
          return (await caches.match(OFFLINE_URL)) || Response.error()
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
