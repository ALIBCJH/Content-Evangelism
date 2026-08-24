import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * What a reader gets when the network is not there and the page they
 * asked for was never kept.
 *
 * It says what happened, what is still readable, and nothing else. A page
 * shown to somebody with no connection is not the place for a picture
 * they cannot load or a link they cannot follow.
 */
export const metadata: Metadata = {
  title: 'No connection',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <main className="shell max-w-[36rem] pb-24 pt-16 text-center">
      <span className="kicker text-gold">No connection</span>
      <h1 className="mt-3 font-article text-[2rem] font-normal leading-[1.15] text-navy">
        This page is not on the device
      </h1>
      <p className="mt-4 text-[1.0625rem] leading-[1.7] text-ink-700">
        The teachings you saved, and the ones you have already read, are here and will open without
        a connection. Anything else waits until there is one.
      </p>

      {/* Kept on the device at install rather than on a visit, so this is
          a promise the page can make: where the ministry meets, and the
          number to call, are readable with no signal at all. */}
      <p className="mt-4 text-[1.0625rem] leading-[1.7] text-ink-700">
        Where the ministry meets is here too — every altar, its address and its phone number, kept
        on this device.
      </p>

      <p className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/altars"
          className="focus-ring inline-flex items-center gap-2 rounded-chip bg-cta px-5 py-2.5 text-[0.9375rem] font-semibold text-cta-ink transition-colors hover:bg-cta-hover"
        >
          Where we meet
        </Link>
        <Link
          href="/"
          className="focus-ring inline-flex items-center gap-2 rounded-chip border border-hairline-strong px-5 py-2.5 text-[0.9375rem] font-semibold text-ink transition-colors hover:border-gold/60"
        >
          What is saved
        </Link>
      </p>
    </main>
  )
}
