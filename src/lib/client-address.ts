/**
 * The address a request came from, for the counters that limit by it.
 *
 * `X-Forwarded-For` is a list, and which end of it is trustworthy is the
 * whole question. A proxy appends the address it saw to whatever the
 * client sent, so everything to the left of the last entry was written by
 * somebody we have no reason to believe — including, on a request built
 * for the purpose, a full list of fictitious addresses.
 *
 * So: the **last** entry, which is the one written by the proxy closest to
 * us and the only one nobody upstream of it could forge. Taking the first
 * is the common mistake and it turns every limit here into a header a
 * caller varies — which matters most in front of `/api/ask`, where a
 * metered model call sits behind the counter.
 *
 * This is correct on both hosts this repository is shaped for. Vercel
 * replaces the header outright, so the list is one entry and either end is
 * the same address. Heroku appends, so only the last entry is the client.
 * A deployment sitting behind proxies of its own sets TRUSTED_PROXY_HOPS
 * to how many of them there are, and the count steps that many places left
 * from the end.
 *
 * `unknown` is a real answer, and a shared one: a caller who arrives with
 * no address at all is limited alongside every other such caller rather
 * than being handed an exemption.
 */
const HOPS = Math.max(0, Math.floor(Number(process.env.TRUSTED_PROXY_HOPS ?? '0')) || 0)

export function addressOf(request: Request): string {
  const forwarded = (request.headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  if (forwarded.length > 0) {
    const index = Math.max(0, forwarded.length - 1 - HOPS)
    return forwarded[index]
  }

  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}
