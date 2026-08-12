import { radioChannel, siteUrl, youtubeChannel } from '@/lib/content'

/**
 * Server-side SEO configuration.
 *
 * Everything here that names the ministry off-site — social profiles, the
 * X handle, the Search Console token — is read from the environment and
 * omitted when unset. A guessed handle or an invented profile URL is worse
 * than none: it points crawlers at an account the ministry does not own.
 *
 * This module is server-only by design. `content.ts` is imported by client
 * components, so env-driven values live here instead, where `process.env`
 * is always real.
 */

/** Splits a comma-separated env var into trimmed, non-empty entries. */
function envList(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

/**
 * Resolves a stored image reference to an absolute URL.
 *
 * Article images may be site-relative ("/images/x.jpg") or absolute
 * ("https://cdn.example/x.jpg") — `validateInput` accepts both. Prefixing
 * the site URL unconditionally corrupts the absolute form, which is how
 * broken `image` values reach structured data.
 */
export function absoluteUrl(pathOrUrl: string): string {
  return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${siteUrl}${pathOrUrl}`
}

/**
 * Hosts the Next image optimizer will resize for.
 *
 * Empty by default: every image the site ships is local, and an optimizer
 * open to `**` is a free resizing service anyone can point at any URL.
 * Set IMAGE_HOSTS (comma-separated hostnames, wildcards allowed) when the
 * ministry settles on a CDN. `next.config.js` reads the same variable.
 */
export const imageHosts = envList('IMAGE_HOSTS')

/**
 * Official profiles for the Organization `sameAs` set — the strongest
 * signal tying this domain to the ministry as an entity. The radio station
 * and YouTube channel are known; add the rest via SOCIAL_PROFILES.
 */
export const socialProfiles: string[] = [
  youtubeChannel.href,
  radioChannel.href,
  ...envList('SOCIAL_PROFILES'),
]

/** X/Twitter handle including the leading "@", e.g. "@repentprepare". */
export const twitterHandle: string | undefined =
  process.env.TWITTER_HANDLE?.trim() || undefined

/** Search Console verification token (the content= value of the meta tag). */
export const googleVerification: string | undefined =
  process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined

/** Point of contact published in the Organization graph, when set. */
export const contactEmail: string | undefined =
  process.env.CONTACT_EMAIL?.trim() || undefined

/**
 * True when a remote image URL points at an allowlisted host. Checked at
 * posting time so an unreachable host fails with a clear message at the
 * desk, rather than as a 500 on the published article — next/image throws
 * on any host `next.config.js` does not list.
 */
export function isAllowedImageHost(url: string): boolean {
  let hostname: string
  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch {
    return false
  }
  return imageHosts.some((pattern) => {
    const allowed = pattern.toLowerCase()
    if (allowed === '**' || allowed === '*') return true
    if (allowed.startsWith('*.')) {
      const base = allowed.slice(2)
      return hostname === base || hostname.endsWith(`.${base}`)
    }
    return hostname === allowed
  })
}

/**
 * The feed link, re-declared on every indexable page. Next replaces the
 * whole `alternates` object when a page sets its own canonical, so a feed
 * declared only on the root layout disappears from every page beneath it.
 */
export const rssAlternate = {
  'application/rss+xml': [{ url: '/feed.xml', title: 'Repent and Prepare the Way' }],
}
