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
}

module.exports = nextConfig
