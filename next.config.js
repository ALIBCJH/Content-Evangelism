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
