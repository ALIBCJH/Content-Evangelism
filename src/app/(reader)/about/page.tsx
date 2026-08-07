import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { channels, siteInfo, siteUrl } from '@/lib/content'
import { JsonLd } from '@/components/json-ld'

export const metadata: Metadata = {
  title: 'About',
  description:
    'The Ministry of Repentance and Holiness — calling the nations to repentance, righteousness, and holiness in preparation for the coming of the Messiah.',
  alternates: { canonical: '/about' },
}

/* Questions readers actually ask, answered plainly. Server-rendered as
   FAQ structured data so the answers can surface directly in search and
   in the AI engines that never run JavaScript. */
const faq = [
  {
    q: 'What is the Ministry of Repentance and Holiness?',
    a: 'A global Christian ministry devoted to calling the nations back to the Lord through repentance, righteousness, and holiness, in preparation for the glorious coming of the Messiah. Its message is drawn from the cry of Isaiah 40:3 — “Prepare ye the way of the LORD.”',
  },
  {
    q: 'Who leads the ministry?',
    a: `The ministry is led by ${siteInfo.head}.`,
  },
  {
    q: 'What is published here?',
    a: 'Teachings and prophecies from the publication desk. Everything is written to be read, studied, and passed on — the reading room is free, and every article can be sent onward with a single tap.',
  },
  {
    q: 'Where can I listen or watch?',
    a: 'Jesus is LORD Radio carries worship, teachings, and live services twenty-four hours a day, and the services are carried on the ministry’s YouTube channel as well.',
  },
]

export default function AboutPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${siteUrl}/about#faq`,
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
      <JsonLd data={faqLd} />
      <main className="shell pb-8">
        <header className="pt-12 md:pt-16">
          <p className="kicker mb-4 text-ink-subtle">About</p>
          <h1 className="mb-4 font-display text-[2.4rem] font-light leading-[1.04] tracking-[-0.02em] text-ink-strong sm:text-[3rem] md:text-[3.4rem]">
            The Ministry of Repentance and Holiness
          </h1>
          <p className="mb-11 max-w-lg border-b border-thread pb-11 font-display text-lg font-light italic leading-[1.5] text-ink-muted sm:text-xl">
            “The voice of him that crieth in the wilderness: Prepare ye the way of the
            LORD.” — Isaiah 40:3
          </p>
        </header>

        {/* ── The ministry, on cloth ───────────────────────────────── */}
        <article className="cloth px-6 py-9 sm:px-9">
          <p className="dropcap">
            The Ministry of Repentance and Holiness is a global Christian ministry with
            one message and one errand: to call the nations back to the Lord through
            repentance, righteousness, and holiness, in preparation for the glorious
            coming of the Messiah. The ministry is led by {siteInfo.head}, and its call
            has gone out across the nations — in open-air meetings, pastors’
            conferences, revival services, and the daily broadcast of the word.
          </p>
          <p className="mt-5">
            <strong className="font-bold">{siteInfo.name}</strong> is the ministry’s
            publication desk. Everything on this site is published so that it can be
            read, studied, shared, and searched. The reading room is free, and it is
            meant to travel.
          </p>
          <p className="mt-5">
            The desk is one door among several. The ministry’s official station,{' '}
            <strong className="font-bold">Jesus is LORD Radio</strong>, broadcasts
            worship, teachings, and live services twenty-four hours a day.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {channels.map((channel) => (
              <a
                key={channel.key}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center rounded-full border border-hairline-strong px-5 py-2.5 font-sans text-[0.8125rem] font-medium tracking-[0.04em] text-ink transition-colors hover:border-gold hover:text-gold"
              >
                {channel.name}
              </a>
            ))}
          </div>
        </article>

        {/* ── Questions ────────────────────────────────────────────── */}
        <section aria-labelledby="faq" className="pt-12 md:pt-16">
          <h2
            id="faq"
            className="mb-8 font-display text-[1.9rem] font-light leading-[1.08] tracking-[-0.018em] text-ink-strong sm:text-[2.2rem]"
          >
            Questions, answered plainly
          </h2>
          <dl>
            {faq.map((item) => (
              <div key={item.q} className="border-b border-thread py-7 first:border-t">
                <dt className="mb-2.5 font-display text-[1.35rem] font-normal leading-[1.18] text-ink-strong">
                  {item.q}
                </dt>
                <dd className="text-[1.0625rem] leading-[1.62] text-ink-muted sm:text-lg">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-8 border-t border-thread py-14 text-center">
          <Link
            href="/"
            className="border-b border-gold-ink pb-0.5 font-sans text-[0.8125rem] font-medium tracking-[0.05em] text-gold transition-colors hover:text-ink"
          >
            Read the archive
          </Link>
        </div>
      </main>
    </>
  )
}
