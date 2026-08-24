import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * The one value the whole site describes itself with.
 *
 * Canonical tags, the sitemap, the feed, every Open Graph URL and every
 * `@id` in the structured data are built from `siteUrl` — a hundred and
 * sixty references to it. A deployment that answers on one address while
 * declaring another is telling Google the real page is somewhere else,
 * and Google believes it: the site reads as un-indexed with nothing on
 * the page to explain why. So it comes from the environment, and these
 * are the rules that keep it usable.
 */

async function siteUrlWith(value?: string) {
  vi.resetModules()
  if (value === undefined) vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
  else vi.stubEnv('NEXT_PUBLIC_SITE_URL', value)
  const mod = await import('@/lib/content')
  return mod.siteUrl
}

afterEach(() => vi.unstubAllEnvs())

describe('the address the site gives for itself', () => {
  it('is whatever the deployment was told', async () => {
    expect(await siteUrlWith('https://read.repentanceonline.com')).toBe(
      'https://read.repentanceonline.com'
    )
  })

  it('keeps the published address when nothing is set', async () => {
    /* A deployment nobody has configured must not start describing itself
       as somewhere else. */
    expect(await siteUrlWith()).toBe('https://repentandpreparetheway.org')
  })

  it('never ends in a slash', async () => {
    /* Every use of it appends a path — `${siteUrl}${row.href}` — so a
       trailing slash is a canonical tag with two of them in the middle,
       which is a different URL to a crawler. */
    expect(await siteUrlWith('https://read.repentanceonline.com/')).toBe(
      'https://read.repentanceonline.com'
    )
    expect(await siteUrlWith('https://read.repentanceonline.com///')).toBe(
      'https://read.repentanceonline.com'
    )
  })

  it('survives a value pasted with whitespace around it', async () => {
    expect(await siteUrlWith('  https://read.repentanceonline.com  ')).toBe(
      'https://read.repentanceonline.com'
    )
  })

  it('carries the port, for a deployment that answers on one', async () => {
    expect(await siteUrlWith('http://localhost:3000')).toBe('http://localhost:3000')
  })
})
