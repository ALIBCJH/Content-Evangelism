/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Posted articles may reference any https image URL. This makes the
    // optimizer an open resizer — tighten to an allowlist once the image
    // hosts are settled.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    // The archive moved to the landing page. /articles/<slug> still serves
    // individual pieces, so only the bare index redirects. The old
    // /category/* URLs map onto the section pages that replaced them.
    return [
      { source: '/articles', destination: '/', permanent: true },
      { source: '/category/teachings', destination: '/teachings', permanent: true },
      { source: '/category/prophecy', destination: '/prophecies', permanent: true },
      { source: '/category/:slug', destination: '/', permanent: true },
    ]
  },
}

module.exports = nextConfig
