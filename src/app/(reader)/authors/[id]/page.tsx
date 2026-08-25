import * as React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { authorHref, siteInfo, siteUrl, type Author } from '@/lib/content'
import { authorDirectory, byId } from '@/lib/authors'
import { listRealRows } from '@/lib/rows'
import { wroteIt } from '@/lib/posted'
import { rssAlternate } from '@/lib/seo'
import { ArchiveView } from '@/components/archive/archive-view'
import { JsonLd } from '@/components/json-ld'

/**
 * An author's page: who wrote a piece, and everything else they have
 * written here.
 *
 * Google's guidance on who a piece comes from is now most of what
 * separates a teaching that ranks from one that does not, and an `author`
 * in structured data carries far more weight when it resolves to a real
 * page describing a real person.
 *
 * A profile is published only for someone who has actually written
 * something on this site, and the piece count is read off the archive —
 * never from the seed figure in the author table, which describes a
 * lifetime of writing rather than what is published here.
 */

export const revalidate = 300

interface Params {
  params: { id: string }
}

/** The author, plus what they have published here — or null if nothing. */
async function authorWithWork(id: string): Promise<{ author: Author; count: number } | null> {
  const author = byId(await authorDirectory(), id)
  if (!author) return null
  const count = (await listRealRows()).filter((row) => wroteIt(row, author)).length
  return count > 0 ? { author, count } : null
}

export async function generateStaticParams() {
  const rows = await listRealRows()
  const directory = await authorDirectory()
  /* By the same rule the page itself uses. A set of bylines would miss an
     author whose pieces carry their id and somebody else's spelling. */
  return directory
    .filter((author) => rows.some((row) => wroteIt(row, author)))
    .map((author) => ({ id: author.id }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const found = await authorWithWork(params.id)
  if (!found) return { title: 'Author not found', robots: { index: false, follow: false } }

  const { author } = found
  const description = `${author.role} at ${siteInfo.name}. ${author.bio}`
  return {
    title: author.name,
    description,
    alternates: { canonical: authorHref(author), types: rssAlternate },
    openGraph: {
      type: 'profile',
      title: `${author.name} — ${author.role}`,
      description,
      url: authorHref(author),
    },
  }
}

export default async function AuthorPage({ params }: Params) {
  const found = await authorWithWork(params.id)
  if (!found) notFound()

  const { author, count } = found
  const url = `${siteUrl}${authorHref(author)}`

  const profileLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': url,
    url,
    isPartOf: { '@id': `${siteUrl}/#website` },
    inLanguage: 'en',
    mainEntity:
      author.kind === 'desk'
        ? {
            '@type': 'Organization',
            '@id': `${siteUrl}/#ministry`,
            name: siteInfo.ministry,
            alternateName: author.name,
            url,
            description: author.bio,
          }
        : {
            '@type': 'Person',
            '@id': `${url}#person`,
            name: author.name,
            url,
            jobTitle: author.role,
            description: author.bio,
            worksFor: { '@id': `${siteUrl}/#ministry` },
          },
  }

  return (
    <>
      <JsonLd data={profileLd} />
      <ArchiveView
        title={author.name}
        purpose={author.bio}
        emptyMessage="Nothing published here yet."
        filter={(row) => wroteIt(row, author)}
        crumbs={[
          { name: 'Articles', href: '/' },
          { name: `${author.name} · ${count} ${count === 1 ? 'piece' : 'pieces'}` },
        ]}
        collection={{
          name: `Writing by ${author.name}`,
          description: author.bio,
          path: authorHref(author),
        }}
      />
    </>
  )
}
