import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { siteUrl } from '@/lib/content'
import { listAnswers } from '@/lib/questions'
import { bodyToPlainText } from '@/lib/article-body'
import { rssAlternate } from '@/lib/seo'
import { AskQuestion } from '@/components/ask-question'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'

/**
 * What readers have asked, and what the desk answered.
 *
 * The site has taken questions from the foot of every page since the box
 * shipped, and every one of them went into a queue only the desk could
 * read. That is right for a question meant for one person and wrong for
 * the other kind — the ones half the congregation is also wondering, sent
 * one at a time and answered one at a time, where the answer helps
 * exactly one reader and then disappears.
 *
 * So an answer can be published. What goes up is the desk's wording of
 * the question and the desk's answer to it — never the reader's own text,
 * never their name, never the page they were on. Publishing is a
 * deliberate act at the desk and not a status a question drifts into.
 *
 * The page renders whether or not anything has been published, because
 * the link to it is in the ask box on every page and a link that
 * sometimes 404s is worse than a page that says "not yet". It carries
 * `noindex` while it is empty, so nothing empty is offered to a crawler.
 */

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const answers = await listAnswers()

  return {
    title: 'Questions Answered',
    description:
      'Questions readers have sent to the Ministry of Repentance and Holiness, answered in the open — on repentance, holiness, the prophetic message, and the life of the believer.',
    alternates: { canonical: '/questions', types: rssAlternate },
    ...(answers.length === 0 ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function QuestionsPage() {
  const answers = await listAnswers()

  return (
    <main>
      {answers.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            '@id': `${siteUrl}/questions`,
            url: `${siteUrl}/questions`,
            name: 'Questions Answered',
            isPartOf: { '@id': `${siteUrl}/#website` },
            inLanguage: 'en',
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: answers.length,
              itemListElement: answers.map((answer, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `${siteUrl}/questions/${answer.slug}`,
                name: answer.question,
              })),
            },
          }}
        />
      )}

      {/* ── The band ─────────────────────────────────────────────── */}
      <section className="border-b border-rule bg-raised">
        <div className="shell pb-14 pt-10">
          <Breadcrumbs className="mb-7" crumbs={[{ name: 'Home', href: '/' }, { name: 'Questions' }]} />

          <p className="kicker mb-4 text-gold">Questions answered</p>
          <h1 className="mb-6 max-w-[20ch] text-balance font-display text-[2.25rem] font-medium leading-[1.05] tracking-[-0.02em] text-navy sm:text-[3.25rem]">
            What readers have asked
          </h1>
          <span aria-hidden className="mb-7 block h-[3px] w-16 rounded-full bg-gold" />

          <p className="max-w-measure text-pretty text-[1.0625rem] leading-[1.8] text-ink-700 sm:text-[1.125rem]">
            These come from the box at the foot of the pages on this site. Where an answer is of
            use to more than the person who asked, it is published here — the question in the
            desk&rsquo;s own wording, and the answer under it. Nothing that could identify whoever
            asked is ever published.
          </p>

          {answers.length > 0 && (
            <p className="mt-7 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-subtle">
              <span className="tabular text-gold-ink">{answers.length}</span>{' '}
              {answers.length === 1 ? 'question' : 'questions'} answered in the open
            </p>
          )}
        </div>
      </section>

      <div className="shell py-14 sm:py-16">
        {answers.length === 0 ? (
          <p className="mx-auto max-w-measure rounded-panel border border-rule bg-card px-7 py-12 text-center text-[1.0625rem] leading-[1.75] text-ink-700">
            Nothing has been answered in the open yet. Ask below — a question that would help
            others is answered here, where they can find it.
          </p>
        ) : (
          <ul className="grid gap-5 lg:grid-cols-2">
            {answers.map((answer) => {
              const plain = bodyToPlainText(answer.answer)
              return (
                <li key={answer.slug}>
                  <Link
                    href={`/questions/${answer.slug}`}
                    className="focus-ring group flex h-full flex-col rounded-panel border border-rule bg-card p-7 transition-colors hover:border-gold/60 sm:p-8"
                  >
                    <span className="kicker mb-4 text-gold-ink">
                      <time dateTime={answer.publishedAt}>
                        {format(parseISO(answer.publishedAt), 'd MMMM yyyy')}
                      </time>
                    </span>
                    <h2 className="mb-4 text-balance font-display text-[1.375rem] leading-[1.2] text-navy">
                      {answer.question}
                    </h2>
                    <p className="mb-6 line-clamp-4 text-[0.9375rem] leading-[1.7] text-ink-700">
                      {plain}
                    </p>
                    <span className="kicker mt-auto flex items-center gap-2 text-gold-ink">
                      Read the answer
                      <ArrowRight
                        aria-hidden
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <AskQuestion title="Questions answered" subject="anything on this site" />
    </main>
  )
}
