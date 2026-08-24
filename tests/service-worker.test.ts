import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The worker's rules, exercised in node.
 *
 * A browser is where this finally runs, and a headless one will not wait
 * for the worker thread — so what can be checked here is what is most
 * likely to be wrong: which requests it takes responsibility for, which
 * it must never touch, and the order it falls back in when the network is
 * gone. Getting any of those wrong is how a service worker turns a slow
 * site into a broken one.
 */

type Handler = (event: any) => void

function loadWorker() {
  const source = readFileSync(path.join(process.cwd(), 'public', 'sw.js'), 'utf8')
  const handlers: Record<string, Handler> = {}
  const stores = new Map<string, Map<string, string>>()

  /* A cache key is a URL, and the browser resolves a relative one against
     the worker's scope before storing it — so '/altars' put in at install
     and 'https://site.test/altars' asked for on a navigation are the same
     entry. The harness has to agree, or it will report a hit the browser
     would miss and a miss the browser would hit. */
  const keyFor = (request: any) =>
    new URL(typeof request === 'string' ? request : request.url, 'https://site.test').href

  const cacheFor = (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map())
    const store = stores.get(name)!
    return {
      addAll: async (urls: string[]) => urls.forEach((url) => store.set(keyFor(url), `body:${url}`)),
      put: async (request: any, response: any) => {
        store.set(keyFor(request), response?.body ?? 'body')
      },
      match: async (request: any) => {
        const key = keyFor(request)
        return store.has(key) ? { body: store.get(key), from: name } : undefined
      },
      delete: async (request: any) => store.delete(keyFor(request)),
    }
  }

  const caches = {
    open: async (name: string) => cacheFor(name),
    keys: async () => Array.from(stores.keys()),
    delete: async (name: string) => stores.delete(name),
    match: async (request: any, options?: { cacheName?: string }) => {
      if (options?.cacheName) return cacheFor(options.cacheName).match(request)
      for (const name of Array.from(stores.keys())) {
        const hit = await cacheFor(name).match(request)
        if (hit) return hit
      }
      return undefined
    },
  }

  const self = {
    addEventListener: (type: string, handler: Handler) => {
      handlers[type] = handler
    },
    location: { origin: 'https://site.test' },
    skipWaiting: () => undefined,
    clients: { claim: () => undefined },
  }

  const fetchStub = vi.fn(async () => ({ ok: true, body: 'network', clone: () => ({ body: 'network' }) }))
  const Response = { error: () => ({ body: 'error' }) }

  // eslint-disable-next-line no-new-func
  new Function('self', 'caches', 'fetch', 'Response', 'URL', source)(self, caches, fetchStub, Response, URL)

  return { handlers, caches, stores, fetch: fetchStub }
}

/** A request as the worker sees one. */
const req = (pathname: string, mode = 'no-cors', method = 'GET') => ({
  url: `https://site.test${pathname}`,
  method,
  mode,
})

function fetchEvent(request: any) {
  let answered: Promise<any> | null = null
  return {
    event: { request, respondWith: (value: Promise<any>) => (answered = value), waitUntil: () => undefined },
    answered: () => answered,
  }
}

describe('what the worker takes responsibility for', () => {
  let worker: ReturnType<typeof loadWorker>
  beforeEach(() => {
    worker = loadWorker()
  })

  it('never touches the desk or the endpoints', () => {
    for (const pathname of ['/admin', '/admin/review', '/api/articles', '/api/v1/articles', '/api/ask']) {
      const { event, answered } = fetchEvent(req(pathname, 'navigate'))
      worker.handlers.fetch(event)
      expect(answered(), pathname).toBeNull()
    }
  })

  it('never touches another origin, or a write', () => {
    const foreign = { url: 'https://youtube.com/watch', method: 'GET', mode: 'no-cors' }
    const write = req('/articles/x', 'navigate', 'POST')
    for (const request of [foreign, write]) {
      const { event, answered } = fetchEvent(request)
      worker.handlers.fetch(event)
      expect(answered()).toBeNull()
    }
  })

  it('does take responsibility for a page and for the build’s own files', () => {
    for (const request of [req('/articles/x', 'navigate'), req('/_next/static/chunk.js')]) {
      const { event, answered } = fetchEvent(request)
      worker.handlers.fetch(event)
      expect(answered()).not.toBeNull()
    }
  })
})

describe('when the network is gone', () => {
  it('falls back to the saved copy before anything else', async () => {
    const worker = loadWorker()
    const href = 'https://site.test/articles/saved-one'
    ;(await worker.caches.open('saved-v1')).put(href, { body: 'the saved teaching' })
    ;(await worker.caches.open('pages-v1')).put(href, { body: 'a stale visit' })
    worker.fetch.mockRejectedValueOnce(new Error('offline'))

    const { event, answered } = fetchEvent({ url: href, method: 'GET', mode: 'navigate' })
    worker.handlers.fetch(event)
    expect((await answered()).body).toBe('the saved teaching')
  })

  it('then to a page the reader has already opened', async () => {
    const worker = loadWorker()
    const href = 'https://site.test/articles/read-before'
    ;(await worker.caches.open('pages-v1')).put(href, { body: 'read before' })
    worker.fetch.mockRejectedValueOnce(new Error('offline'))

    const { event, answered } = fetchEvent({ url: href, method: 'GET', mode: 'navigate' })
    worker.handlers.fetch(event)
    expect((await answered()).body).toBe('read before')
  })

  it('and finally to the page that explains itself', async () => {
    const worker = loadWorker()
    await worker.handlers.install({ waitUntil: (p: Promise<any>) => p })
    worker.fetch.mockRejectedValueOnce(new Error('offline'))

    const { event, answered } = fetchEvent({
      url: 'https://site.test/articles/never-seen',
      method: 'GET',
      mode: 'navigate',
    })
    worker.handlers.fetch(event)
    expect((await answered()).body).toContain('/offline')
  })
})

describe('saving a teaching', () => {
  it('fetches it at the moment it is saved, and lets it go when it is not', async () => {
    const worker = loadWorker()
    const href = '/articles/why-does-god-allow-suffering'

    await worker.handlers.message({ data: { type: 'keep', href }, waitUntil: (p: Promise<any>) => p })
    expect(await (await worker.caches.open('saved-v1')).match(href)).toBeTruthy()
    expect(worker.fetch).toHaveBeenCalledWith(href, { cache: 'no-store' })

    await worker.handlers.message({ data: { type: 'release', href }, waitUntil: (p: Promise<any>) => p })
    expect(await (await worker.caches.open('saved-v1')).match(href)).toBeFalsy()
  })

  it('ignores a message that is not one of its own', async () => {
    const worker = loadWorker()
    await worker.handlers.message({ data: { type: 'nonsense', href: '/x' }, waitUntil: (p: any) => p })
    await worker.handlers.message({ data: {}, waitUntil: (p: any) => p })
    expect(worker.fetch).not.toHaveBeenCalled()
  })
})

describe('an old worker', () => {
  it('takes its caches with it', async () => {
    const worker = loadWorker()
    await worker.caches.open('shell-v0')
    await worker.caches.open('pages-v1')
    await worker.handlers.activate({ waitUntil: (p: Promise<any>) => p })
    const left = await worker.caches.keys()
    expect(left).not.toContain('shell-v0')
    expect(left).toContain('pages-v1')
  })
})

describe('the altars, kept in advance', () => {
  it('puts them on the device at install, not on a visit', async () => {
    const worker = loadWorker()
    await worker.handlers.install({ waitUntil: (p: Promise<any>) => p })

    const pages = await worker.caches.open('pages-v1')
    expect(await pages.match('/altars')).toBeTruthy()
  })

  it('serves them when the network is gone and they were never opened', async () => {
    const worker = loadWorker()
    await worker.handlers.install({ waitUntil: (p: Promise<any>) => p })
    worker.fetch.mockRejectedValueOnce(new Error('offline'))

    const { event, answered } = fetchEvent({
      url: 'https://site.test/altars',
      method: 'GET',
      mode: 'navigate',
    })
    worker.handlers.fetch(event)

    const response = await answered()
    expect(response.body).toContain('/altars')
    /* The offline page would also be a truthy answer, so name the cache
       it actually came from rather than trusting the body alone. */
    expect(response.from).toBe('pages-v1')
  })

  it('installs anyway when the altars cannot be fetched', async () => {
    const worker = loadWorker()
    /* The shell precache resolves; the altars do not. A reader with no
       altars cached is a smaller failure than a reader with no worker. */
    worker.fetch.mockRejectedValue(new Error('offline'))
    const original = worker.caches.open
    worker.caches.open = (async (name: string) => {
      const cache = await original(name)
      if (name !== 'pages-v1') return cache
      return { ...cache, addAll: async () => Promise.reject(new Error('no network')) }
    }) as typeof worker.caches.open

    let installing: Promise<any> = Promise.resolve()
    worker.handlers.install({ waitUntil: (p: Promise<any>) => (installing = p) })
    await expect(installing).resolves.not.toThrow()

    worker.caches.open = original
    expect(await (await worker.caches.open('shell-v1')).match('/offline')).toBeTruthy()
  })
})
