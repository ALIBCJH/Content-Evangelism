/**
 * Hosts the image optimizer is allowed to resize for.
 *
 * Every image the site ships is local, so the default is "none". The
 * previous `hostname: '**'` turned /_next/image into a public resizing
 * service anyone could point at any URL on the internet — bandwidth and
 * CPU spent on someone else's images, paid for in the page speed of real
 * readers. `src/lib/seo.ts` reads the same variable so the posting desk
 * rejects an unlistable host up front instead of publishing a page that
 * 500s on load.
 */
const imageHosts = (process.env.IMAGE_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)

/**
 * The content security policy.
 *
 * Written without a nonce, deliberately. The nonce-and-strict-dynamic
 * recipe is the stronger one and it cannot work here: these pages are
 * statically generated and served from a cache for the length of the
 * revalidation window, so a nonce minted per request would not match the
 * one baked into the HTML being handed out — every page would break, and
 * break intermittently, which is worse than breaking outright.
 *
 * So `script-src` keeps 'unsafe-inline' for Next's own bootstrap, and this
 * policy is honest about what it buys: not protection against an injected
 * inline script, but a closed door on every other route out. No script may
 * be *loaded* from a host that is not this one. `object-src 'none'` ends
 * the plugin routes; `base-uri 'self'` stops an injected <base> from
 * repointing every relative URL on the page; `form-action 'self'` stops a
 * form from being made to post the desk's fields somewhere else. Those
 * three are where a content injection on a page like this would actually
 * go, and none of them needs a nonce.
 *
 * Everything the site loads is its own. Fonts come through next/font,
 * which downloads them at build time and serves them from /_next, so there
 * is no font host here. YouTube is the one external origin: the player is
 * framed from youtube-nocookie.com, and poster frames come from i.ytimg.com
 * through the image optimizer, which re-serves them from this origin —
 * i.ytimg.com is listed anyway so that an unoptimised <img> in a teaching
 * does not silently vanish.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://i.ytimg.com${imageHosts.map((host) => ` https://${host}`).join('')}`,
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  'frame-src https://www.youtube-nocookie.com https://www.youtube.com',
  'upgrade-insecure-requests',
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    /* The teachings kept in content/articles are read at runtime with a
       directory listing, which the bundler cannot see and so does not
       carry into a serverless function. Without this the deployment ships
       the code that reads them and none of the files, and the archive is
       empty on a host with no store attached. */
    outputFileTracingIncludes: { '/**': ['./content/articles/*.json'] },
  },
  images: {
    /* i.ytimg.com is not a configurable host: it is where the poster frame
       of every prophecy recording comes from, and the archive cannot draw
       its own thumbnails without it. */
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      ...imageHosts.map((hostname) => ({ protocol: 'https', hostname })),
    ],
    formats: ['image/avif', 'image/webp'],
    // A year: the URL carries a content hash, so a changed image is a
    // changed URL and there is nothing to invalidate.
    minimumCacheTTL: 31_536_000,
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
  },
  async redirects() {
    // The archive lives at /articles again and the front page is the
    // ministry's own landing page, so the old /articles → / redirect is
    // gone; leaving it would bounce the index off itself.
    //
    // The old /category/* URLs land on the topic pages, which are the real
    // thing they described.
    return [
      { source: '/category/:slug', destination: '/topics/:slug', permanent: true },
      /* The archive is the front page now. Teachings keep their
         /articles/<slug> URLs — this matches the index alone. */
      { source: '/articles', destination: '/', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        /* Sent on everything. */
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          // A .txt served as HTML because a browser guessed is a way in.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Nobody needs to frame a ministry's teachings but the ministry.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // The path a reader was on is theirs, not the next site's.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Nothing here asks for a camera, a microphone or a location.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          /* Two years, subdomains included, and deliberately not
             preloaded: preloading is a list that is slow to leave, and
             that is a decision for the ministry rather than a default. */
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
        ],
      },
      {
        /* The public API is meant to be read by other people's software,
           including software running in a browser. Without this a page on
           another origin is refused by the browser before the request is
           even made — which for an API built to be found is a door with a
           sign on it and a lock nobody mentioned. Read-only, so there is
           nothing here for a cross-origin caller to abuse. */
        source: '/api/:path(v1|v1/.*|openapi.json)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
      {
        // The feed and the sitemap are fetched far more often than they
        // change, and by clients that respect cache headers.
        source: '/:path(feed.xml|sitemap.xml|robots.txt)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
