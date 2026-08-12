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
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: 'https', hostname })),
    formats: ['image/avif', 'image/webp'],
    // A year: the URL carries a content hash, so a changed image is a
    // changed URL and there is nothing to invalidate.
    minimumCacheTTL: 31_536_000,
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
  },
  async redirects() {
    // The archive moved to the landing page. /articles/<slug> still serves
    // individual pieces, so only the bare index redirects.
    //
    // The old /category/* URLs now land on the topic pages, which are the
    // real thing they described — sending them to the two Coming Soon
    // placards would have retired a live URL onto an empty one.
    return [
      { source: '/articles', destination: '/', permanent: true },
      { source: '/category/:slug', destination: '/topics/:slug', permanent: true },
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
