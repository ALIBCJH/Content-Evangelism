import * as React from 'react'
import type { Metadata } from 'next'
import { siteInfo, siteUrl } from '@/lib/content'
import { LIMIT_DEFAULT, LIMIT_MAX, QUERY_MAX } from '@/lib/api/params'
import { ERROR_CODES } from '@/lib/api/errors'
import { CONTENT_FORMAT } from '@/lib/api/resources'
import { JsonLd } from '@/components/json-ld'
import { Breadcrumbs } from '@/components/breadcrumbs'

/**
 * The API, explained to a person.
 *
 * The OpenAPI document is the contract and a machine reads it happily; a
 * developer deciding whether to use this at all wants prose, an example
 * they can paste, and a straight answer about what they may do with what
 * comes back. That is this page. Every bound quoted here is imported from
 * the module that enforces it, so the documentation cannot quietly go out
 * of date.
 */

export const metadata: Metadata = {
  title: 'Public content API',
  description:
    'Read-only JSON access to the published archive of the Ministry of Repentance and Holiness — teachings, the prophetic record, and recorded sermons.',
  alternates: { canonical: '/docs/api' },
}

export const revalidate = 3600

const ENDPOINTS: { method: string; path: string; what: string }[] = [
  { method: 'GET', path: '/api/v1', what: 'What this API is, what it holds, how to page it.' },
  { method: 'GET', path: '/api/openapi.json', what: 'The full specification, for machines.' },
  { method: 'GET', path: '/api/v1/articles', what: 'Published writing, newest first. Filter by q, category, tag, author, from, to.' },
  { method: 'GET', path: '/api/v1/articles/{slug}', what: 'One teaching in full — body, headings, passages cited, related pieces.' },
  { method: 'GET', path: '/api/v1/prophecies', what: 'The prophetic record. Filter by q and tag.' },
  { method: 'GET', path: '/api/v1/prophecies/{id}', what: 'One record, with its timeline and independent documentation.' },
  { method: 'GET', path: '/api/v1/teachings', what: 'Recorded sermons. Filter by q.' },
  { method: 'GET', path: '/api/v1/teachings/{id}', what: 'One recording.' },
  { method: 'GET', path: '/api/v1/categories', what: 'Sections holding published writing, counted.' },
  { method: 'GET', path: '/api/v1/tags', what: 'Tags in use, most-used first.' },
  { method: 'GET', path: '/api/v1/authors', what: 'Bylines that have published.' },
  { method: 'GET', path: '/api/v1/search', what: 'One query across all three collections. q is required.' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-article text-[1.5rem] font-normal leading-[1.24] text-navy">{title}</h2>
      <div className="mt-4 space-y-4 text-[1rem] leading-[1.7] text-ink-700">{children}</div>
    </section>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-panel border border-rule bg-card px-5 py-4 font-mono text-[0.8125rem] leading-[1.7] text-ink">
      <code>{children}</code>
    </pre>
  )
}

export default function ApiDocsPage() {
  return (
    <main className="shell max-w-[52rem] pb-24 pt-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${siteUrl}/docs/api`,
          url: `${siteUrl}/docs/api`,
          name: 'Public content API',
          description:
            'Developer documentation for the read-only JSON API over the published archive.',
          isPartOf: { '@id': `${siteUrl}/#website` },
          about: { '@id': `${siteUrl}/#api` },
          inLanguage: 'en',
        }}
      />
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Public content API' }]} />

      <span className="kicker text-gold">For developers and agents</span>
      <h1 className="mt-3 font-article text-[2.25rem] font-normal leading-[1.1] text-navy md:text-[2.75rem]">
        Public content API
      </h1>
      <p className="mt-4 max-w-prose text-[1.0625rem] leading-[1.7] text-ink-muted">
        Everything the {siteInfo.ministry} publishes here is also available as JSON: the written
        teachings, the prophetic record, and the recorded sermons. Read-only, no key, no account.
      </p>

      <Section title="Start here">
        <p>
          One request tells you the rest. It names the collections, the filters each accepts, the
          shape of a page, and every error code you can be handed.
        </p>
        <Code>{`curl ${siteUrl}/api/v1`}</Code>
        <p>
          The machine-readable contract is at{' '}
          <a className="border-b border-gold/50 hover:text-gold-ink" href="/api/openapi.json">
            /api/openapi.json
          </a>
          , an OpenAPI 3.1 document. Every response also carries a{' '}
          <code className="font-mono text-[0.9em]">Link: …rel=&quot;service-desc&quot;</code> header
          pointing at it, so an agent that arrives at any endpoint can find the specification without
          being told where it is.
        </p>
      </Section>

      <Section title="Endpoints">
        <div className="overflow-x-auto rounded-panel border border-rule">
          <table className="w-full min-w-[36rem] border-collapse text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-rule bg-raised">
                <th className="px-4 py-3 font-apparatus text-[0.75rem] uppercase tracking-[0.08em] text-ink-subtle">Method</th>
                <th className="px-4 py-3 font-apparatus text-[0.75rem] uppercase tracking-[0.08em] text-ink-subtle">Path</th>
                <th className="px-4 py-3 font-apparatus text-[0.75rem] uppercase tracking-[0.08em] text-ink-subtle">What it returns</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((endpoint) => (
                <tr key={endpoint.path} className="border-b border-rule last:border-b-0">
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-gold-ink">{endpoint.method}</td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-ink">{endpoint.path}</td>
                  <td className="px-4 py-3 text-ink-muted">{endpoint.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Versioning">
        <p>
          Every endpoint lives under <code className="font-mono text-[0.9em]">/api/v1</code>. The
          shapes on this page will not change under that prefix: a field may be added, but nothing
          published here is renamed or removed. A change that would break a caller arrives as{' '}
          <code className="font-mono text-[0.9em]">/api/v2</code>, alongside this one rather than in
          place of it.
        </p>
      </Section>

      <Section title="Pagination">
        <p>
          Every collection answers with the same envelope. The default page holds {LIMIT_DEFAULT}{' '}
          items and {LIMIT_MAX} is the ceiling — ask for more and the request is refused by name
          rather than quietly cut down, so you always know what you received.
        </p>
        <Code>{`{
  "data": [ … ],
  "pagination": {
    "page": 1, "limit": ${LIMIT_DEFAULT}, "total": 13,
    "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false
  },
  "query": { "category": "Doctrine", "sort": "newest" }
}`}</Code>
        <p>
          The <code className="font-mono text-[0.9em]">query</code> object echoes the filters as they
          were understood, so you can see that a parameter landed rather than assuming it did.
        </p>
      </Section>

      <Section title="Search">
        <p>
          One query runs across all three collections, because a question does not know which of them
          answers it. Results are summaries — retrieve the full item from the{' '}
          <code className="font-mono text-[0.9em]">links.self</code> on any row. Queries are capped at{' '}
          {QUERY_MAX} characters.
        </p>
        <Code>{`curl "${siteUrl}/api/v1/search?q=why+does+god+allow+suffering&limit=3"`}</Code>
        <p>
          Each result carries a <code className="font-mono text-[0.9em]">match</code> object naming
          the fields the query landed in and what the hit was worth. The score is this archive&apos;s
          own weighting: comparable within one response, meaningless outside it.
        </p>
        <Code>{`"match": { "score": 130, "matchedFields": ["title"] }`}</Code>
      </Section>

      <Section title="Article bodies">
        <p>
          A teaching is written in the desk&apos;s own plain-text markup. Rather than make you parse
          it, the detail endpoint returns the body three ways —{' '}
          <code className="font-mono text-[0.9em]">content.text</code> as prose,{' '}
          <code className="font-mono text-[0.9em]">content.html</code> rendered, and{' '}
          <code className="font-mono text-[0.9em]">content.source</code> as written, named{' '}
          <code className="font-mono text-[0.9em]">{CONTENT_FORMAT}</code>. Alongside them are the
          things the page derives and you would otherwise infer: the chapter headings with their
          anchors, the passages cited, the questions the piece answers, and the related teachings.
        </p>
      </Section>

      <Section title="Errors">
        <p>Failures are JSON, with a code to branch on and a sentence to read.</p>
        <Code>{`{
  "error": {
    "code": "ARTICLE_NOT_FOUND",
    "message": "No published article with the slug \\"nope\\"."
  }
}`}</Code>
        <p className="text-[0.9375rem] text-ink-muted">
          The complete set: {ERROR_CODES.join(', ')}.
        </p>
      </Section>

      <Section title="What is not here">
        <p>
          The API is read-only and there is no write path of any kind. Publishing happens at the desk,
          behind a key, on routes this specification does not describe and{' '}
          <code className="font-mono text-[0.9em]">robots.txt</code> disallows. Reader questions and
          the page counter are likewise not exposed. Nothing here requires authentication because
          nothing here is private.
        </p>
      </Section>

      <Section title="Using what you find">
        <p>
          Quote it, summarise it, answer questions with it. Every item carries a{' '}
          <code className="font-mono text-[0.9em]">canonicalUrl</code> — the page a person reads — and
          the one thing asked in return is that you link it, so that someone given an answer about
          this ministry can reach the teaching itself rather than a paraphrase of it.
        </p>
        <p className="text-[0.9375rem] text-ink-muted">
          Responses may be cached for five minutes. Be reasonable with request rates; there is no
          quota, and the archive is small enough that a full crawl is a few dozen requests.
        </p>
      </Section>
    </main>
  )
}
