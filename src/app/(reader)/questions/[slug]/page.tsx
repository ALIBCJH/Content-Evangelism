import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { siteInfo, siteUrl } from '@/lib/content'
import { answerBySlug, listAnswers } from '@/lib/questions'
import { bodyToPlainText } from '@/lib/article-body'
import { rssAlternate } from '@/lib/seo'
import { ArticleProse } from '@/components/article-prose'
import { AskQuestion } from '@/components/ask-question'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { buttonVariants } from '@/components/ui/button'

/**
 * One question, answered in the open.
 *
 * The page is the pair and nothing else: what was asked, and what the
 * desk said back. It is published with `QAPage` structured data, which is
 * the shape a search engine reads a question-and-answer in — the reason
 * for giving these their own addresses rather than stacking them all on
 * one page is that somebody typing the question into a search box should
 * land on the answer to it.
 *
 * The answer is written in the same grammar a teaching is written in and
 * rendered by the same component, so it can quote Scripture, link to a
 * teaching that goes further, and be read the way everything else here is
 * read.
 */

export const revalidate = 300

interface Params {
  params: { slug: string }
}

export async function generateStaticParams() {
  const answers = await listAnswers()
  return answers.map((answer) => ({ slug: answer.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const answer = await answerBySlug(params.slug)
  if (!answer) return { title: 'Question not found', robots: { index: false, follow: false } }

  const description = bodyToPlainText(answer.answer).slice(0, 300)

  return {
    title: answer.question,
    description,
    alternates: { canonical: `/questions/${answer.slug}`, types: rssAlternate },
    openGraph: {
      type: 'article',
      title: answer.question,
      description,
      url: `/questions/${answer.slug}`,
      publishedTime: answer.publishedAt,
    },
  }
}

export default async function AnswerPage({ params }: Params) {
  const answer = await answerBySlug(params.slug)
  if (!answer) notFound()

  const others = (await listAnswers()).filter((other) => other.slug !== answer.slug).slice(0, 4)

  return (
    <main>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'QAPage',
          '@id': `${siteUrl}/questions/${answer.slug}`,
          url: `${siteUrl}/questions/${answer.slug}`,
          isPartOf: { '@id': `${siteUrl}/#website` },
          inLanguage: 'en',
          mainEntity: {
            '@type': 'Question',
            name: answer.question,
            text: answer.question,
            dateCreated: answer.publishedAt,
            answerCount: 1,
            acceptedAnswer: {
              '@type': 'Answer',
              text: bodyToPlainText(answer.answer),
              url: `${siteUrl}/questions/${answer.slug}`,
              dateCreated: answer.publishedAt,
              author: { '@type': 'Organization', name: siteInfo.ministry },
            },
          },
        }}
      />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
            { '@type': 'ListItem', position: 2, name: 'Questions', item: `${siteUrl}/questions` },
            { '@type': 'ListItem', position: 3, name: answer.question },
          ],
        }}
      />

      {/* ── The question ─────────────────────────────────────────── */}
      <section className="border-b border-rule bg-raised">
        <div className="shell pb-12 pt-10">
          <Breadcrumbs
            className="mb-7"
            crumbs={[
              { name: 'Home', href: '/' },
              { name: 'Questions', href: '/questions' },
              { name: 'Answered' },
            ]}
          />

          <p className="kicker mb-4 text-gold">A reader asked</p>
          <h1 className="mb-5 max-w-[26ch] text-balance font-display text-[1.875rem] font-medium leading-[1.12] tracking-[-0.02em] text-navy sm:text-[2.5rem]">
            {answer.question}
          </h1>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-subtle">
            Answered{' '}
            <time dateTime={answer.publishedAt}>
              {format(parseISO(answer.publishedAt), 'd MMMM yyyy')}
            </time>{' '}
            · The editorial desk
          </p>
        </div>
      </section>

      {/* ── The answer ───────────────────────────────────────────── */}
      {/* Two tracks only when there is something for the second one. With
          one answer published the rail is absent, and a two-track grid
          would leave the answer sitting left of a column of nothing. */}
      <div
        className={`shell items-start gap-12 py-14 ${
          others.length > 0
            ? 'grid lg:grid-cols-[minmax(0,var(--read))_minmax(0,18rem)] lg:justify-center lg:gap-x-16'
            : 'mx-auto max-w-read'
        }`}
      >
        <article>
          <ArticleProse body={answer.answer} />

          <p className="mt-12 border-t border-rule pt-8 text-[0.875rem] leading-[1.7] text-ink-subtle">
            Questions are sent from the box at the foot of the pages on this site. This one is
            published in the desk&rsquo;s own wording — nothing that could identify whoever asked
            is ever published.
          </p>

          <p className="mt-8">
            <Link href="/questions" className={buttonVariants({ variant: 'outline', className: 'gap-2.5 px-7' })}>
              <ArrowLeft aria-hidden />
              All questions
            </Link>
          </p>
        </article>

        {others.length > 0 && (
          <aside className="lg:sticky lg:top-stick">
            <h2 className="mb-4 inline-block border-b-[3px] border-gold pb-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-navy">
              Also asked
            </h2>
            <ul>
              {others.map((other) => (
                <li key={other.slug} className="border-b border-rule last:border-b-0">
                  <Link
                    href={`/questions/${other.slug}`}
                    className="focus-ring group -mx-2 block rounded-tile px-2 py-3.5 transition-colors hover:bg-chip-gold/50"
                  >
                    <span className="block font-apparatus text-[0.9375rem] font-semibold leading-[1.35] text-navy transition-colors group-hover:text-gold-ink">
                      {other.question}
                    </span>
                    <span className="mt-1 block font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-subtle">
                      <time dateTime={other.publishedAt}>
                        {format(parseISO(other.publishedAt), 'd MMM yyyy')}
                      </time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <AskQuestion title={answer.question} subject="this answer" />
    </main>
  )
}
