import { afterEach, describe, expect, it, vi } from 'vitest'
import { bodyToHtml, parseBody } from '@/lib/article-body'

/**
 * Two small holes, both of the same shape: a check that was nearly right,
 * with a case on the other side of it that the codebase already knew about
 * somewhere else.
 */

describe('a link inside a teaching', () => {
  const hrefsIn = (body: string): (string | null)[] =>
    parseBody(body)
      .flatMap((block) => ('inlines' in block ? block.inlines : []))
      .filter((inline) => inline.kind === 'link')
      .map((inline) => (inline as { href: string }).href)

  it('may point at a page on this site', () => {
    expect(hrefsIn('[the teaching](/articles/repentance)')).toEqual(['/articles/repentance'])
  })

  it('may point at a named site over https', () => {
    expect(hrefsIn('[the ministry](https://repentance.example)')).toEqual([
      'https://repentance.example',
    ])
  })

  it('refuses a protocol-relative link, which leaves the site while looking local', () => {
    /* "//elsewhere.example" reads as another host to a browser and passes
       a startsWith('/') check without difficulty. `safeDeskReturn` has
       always refused it; this is the same refusal one module along. */
    expect(hrefsIn('[read more](//elsewhere.example)')).toEqual([])
  })

  it('refuses the backslash spelling of the same trick', () => {
    expect(hrefsIn('[read more](/\\elsewhere.example)')).toEqual([])
  })

  it('still refuses javascript:', () => {
    expect(hrefsIn('[tap here](javascript:alert(1))')).toEqual([])
  })

  it('renders a refused link as its text, so the words survive', () => {
    const html = bodyToHtml('[read more](//elsewhere.example)', 'https://read.example')
    expect(html).toContain('read more')
    expect(html).not.toContain('elsewhere.example')
  })
})

describe('the address a rate limit counts against', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  const withHeaders = async (headers: Record<string, string>) => {
    const { addressOf } = await import('@/lib/client-address')
    return addressOf(new Request('https://read.example/api/ask', { headers }))
  }

  it('takes the entry the nearest proxy wrote, not the one the caller sent', async () => {
    /* A proxy appends what it saw. Everything left of the last entry was
       written by somebody upstream — on a request built for the purpose,
       by the caller. Taking the first turns every limit into a header. */
    expect(await withHeaders({ 'x-forwarded-for': '9.9.9.9, 203.0.113.7' })).toBe('203.0.113.7')
  })

  it('reads a single-entry list the same way, which is what Vercel sends', async () => {
    expect(await withHeaders({ 'x-forwarded-for': '203.0.113.7' })).toBe('203.0.113.7')
  })

  it('tolerates the spacing a proxy chain actually produces', async () => {
    expect(await withHeaders({ 'x-forwarded-for': ' 9.9.9.9 ,, 203.0.113.7 ' })).toBe('203.0.113.7')
  })

  it('steps left by the number of proxies a deployment says it has', async () => {
    vi.resetModules()
    vi.stubEnv('TRUSTED_PROXY_HOPS', '1')
    expect(await withHeaders({ 'x-forwarded-for': '9.9.9.9, 203.0.113.7, 10.0.0.1' })).toBe(
      '203.0.113.7'
    )
  })

  it('falls back to x-real-ip when there is no list', async () => {
    expect(await withHeaders({ 'x-real-ip': '203.0.113.7' })).toBe('203.0.113.7')
  })

  it('gives everybody with no address the same bucket rather than an exemption', async () => {
    expect(await withHeaders({})).toBe('unknown')
  })
})
