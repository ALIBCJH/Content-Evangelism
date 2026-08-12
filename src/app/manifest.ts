import type { MetadataRoute } from 'next'
import { siteInfo } from '@/lib/content'

/**
 * The web app manifest. Readers in the nations the ministry reaches are
 * overwhelmingly on mobile and often on constrained data — an installable
 * reading room that opens from the home screen is worth more here than it
 * is on most sites, and Google reads the manifest for mobile-quality and
 * Discover signals besides.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteInfo.name} — ${siteInfo.ministry}`,
    short_name: siteInfo.name,
    description: siteInfo.mission,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F3EFE6',
    theme_color: '#123563',
    lang: 'en',
    categories: ['books', 'education', 'lifestyle', 'news'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
