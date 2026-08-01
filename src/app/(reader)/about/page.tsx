import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Cross } from 'lucide-react'
import {
  radioChannel,
  siteInfo,
  siteUrl,
  whatsappChannel,
  youtubeChannel,
} from '@/lib/content'
import { JsonLd } from '@/components/json-ld'
import { FadeIn } from '@/components/motion'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'About the Ministry of Repentance and Holiness',
  description:
    'What the Ministry of Repentance and Holiness is, who leads it, its message of repentance and holiness in preparation for the coming of the Messiah, and where to listen, watch, and read.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    title: 'About the Ministry of Repentance and Holiness',
    description:
      'The ministry, its message, its leadership, and its official channels — the radio station, YouTube, and this publication desk.',
  },
}

/* The visible FAQ and the FAQPage structured data are generated from the
   same list, so what a reader sees and what an AI engine retrieves can
   never drift apart. */
const faqs = [
  {
    question: 'What is the Ministry of Repentance and Holiness?',
    answer:
      'The Ministry of Repentance and Holiness is a global Christian ministry devoted to calling the nations back to the Lord through repentance, righteousness, and holiness, in preparation for the glorious coming of the Messiah. Its message is drawn from the cry of Isaiah 40:3 — “Prepare ye the way of the LORD.”',
  },
  {
    question: 'Who leads the Ministry of Repentance and Holiness?',
    answer:
      'The ministry is led by Prophet Dr. David Owuor, under whose ministry the call to national repentance, holiness, and preparation for the coming of the Lord Jesus Christ is proclaimed to the nations.',
  },
  {
    question: 'What is the central message of the ministry?',
    answer:
      'Repentance from sin, righteousness, and holiness of living — because the Lord Jesus Christ is coming, and His church must be prepared. The ministry preaches the cross of Jesus, turning away from sin, and a holy walk with God as the way the church readies herself for the Messiah.',
  },
  {
    question: 'What is Jesus is LORD Radio and where can I listen?',
    answer:
      'Jesus is LORD Radio is the ministry’s official station, broadcasting twenty-four hours a day with worship, teachings, prophecies, and live services. You can listen from anywhere in the world at jesusislordradio.info.',
  },
  {
    question: 'Where can I read the ministry’s teachings, prophecies, and oracles?',
    answer:
      'Right here. Repent and Prepare the Way is the ministry’s publication desk: teachings, prophecies, oracles, devotionals, doctrine, church history, and testimonies are published in the reading room and organized by section, free to read and share.',
  },
  {
    question: 'How can I share these articles?',
    answer:
      'Every article carries a WhatsApp share button and a copy-link button — one tap sends the piece to a friend, a family member, or a fellowship group. The word is meant to travel.',
  },
]

const aboutGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      '@id': `${siteUrl}/about`,
      url: `${siteUrl}/about`,
      name: 'About the Ministry of Repentance and Holiness',
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: { '@id': `${siteUrl}/#ministry` },
      inLanguage: 'en',
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/about#faq`,
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
}

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutGraph} />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6 md:pb-28 lg:px-8">
        <FadeIn>
          <header className="text-center">
            <p className="kicker text-gold">About</p>
            <h1 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-semibold leading-[1.12] tracking-tight text-ink-strong sm:text-4xl md:text-5xl">
              The Ministry of Repentance and Holiness
            </h1>
            <p className="mx-auto mt-6 max-w-2xl font-serif text-lg italic leading-relaxed text-ink-muted">
              “The voice of him that crieth in the wilderness: Prepare ye the way
              of the LORD.” — Isaiah 40:3
            </p>
          </header>

          <div className="mx-auto mt-12 max-w-2xl">
            <p className="dropcap font-serif text-lg leading-[1.85] text-ink-muted">
              The Ministry of Repentance and Holiness is a global Christian
              ministry with one message and one errand: to call the nations back
              to the Lord through repentance, righteousness, and holiness, in
              preparation for the glorious coming of the Messiah. The ministry is
              led by {siteInfo.head}, and its call has gone out across the
              nations — in open-air meetings, pastors’ conferences, revival
              services, and the daily broadcast of the word.
            </p>
            <p className="mt-6 font-serif text-lg leading-[1.85] text-ink-muted">
              <strong className="font-semibold text-ink">Repent and Prepare the
              Way</strong> is the ministry’s publication desk. Everything on this
              site — the teachings, the prophecies, the oracles, the devotionals,
              and the testimonies — is published so that it can be read, studied,
              shared, and searched. The reading room is free, and it is meant to
              travel: every article can be sent onward with a single tap.
            </p>
            <p className="mt-6 font-serif text-lg leading-[1.85] text-ink-muted">
              The desk is one door among several. The ministry’s official
              station, <strong className="font-semibold text-ink">Jesus is LORD
              Radio</strong>, broadcasts worship, teachings, and live services
              twenty-four hours a day, and the services are carried on the
              ministry’s YouTube channel as well.
            </p>

            {/* ── Channels ───────────────────────────────────────── */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a
                href={radioChannel.href}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: 'default' })}
              >
                Listen to Jesus is LORD Radio
              </a>
              <a
                href={youtubeChannel.href}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline' })}
              >
                Watch on YouTube
              </a>
              <a
                href={whatsappChannel.href}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline' })}
              >
                Share on WhatsApp
              </a>
            </div>

            {/* ── FAQ ────────────────────────────────────────────── */}
            <div className="mt-16 border-t border-hairline pt-10">
              <div className="ornament mx-auto max-w-xs">
                <Cross className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <h2 className="mt-8 text-center font-display text-2xl font-semibold text-ink-strong md:text-3xl">
                Questions, Answered Plainly
              </h2>
              <dl className="mt-10 space-y-8">
                {faqs.map((faq) => (
                  <div key={faq.question} className="border-b border-hairline pb-8">
                    <dt className="font-display text-lg font-semibold text-ink-strong">
                      {faq.question}
                    </dt>
                    <dd className="mt-3 font-serif text-base leading-relaxed text-ink-muted">
                      {faq.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-12 flex justify-center">
              <Link href="/articles" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Enter the reading room
                <ArrowRight />
              </Link>
            </div>
          </div>
        </FadeIn>
      </main>
    </>
  )
}
