import * as React from 'react'
import Link from 'next/link'
import { siteUrl } from '@/lib/content'
import { JsonLd } from '@/components/json-ld'

export interface Crumb {
  name: string
  /** Site-relative path; omitted on the final (current-page) crumb. */
  href?: string
}

/**
 * The breadcrumb trail — mono, uppercase, slash-separated, with the page
 * you are on set in gold — and the matching BreadcrumbList structured
 * data. Google reads the JSON-LD for the trail it prints in a result; the
 * visible nav is the affordance that has to agree with it.
 */
export function Breadcrumbs({ crumbs, className = '' }: { crumbs: Crumb[]; className?: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.href ? { item: `${siteUrl}${crumb.href}` } : {}),
    })),
  }
  return (
    <>
      <JsonLd data={data} />
      <nav
        aria-label="Breadcrumb"
        className={`font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-subtle ${className}`}
      >
        <ol className="flex flex-wrap items-center gap-2">
          {crumbs.map((crumb, index) => (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden className="text-ink-subtle/60">
                  /
                </span>
              )}
              {crumb.href ? (
                <Link href={crumb.href} className="py-1 transition-colors hover:text-gold">
                  {crumb.name}
                </Link>
              ) : (
                <span aria-current="page" className="max-w-[16rem] truncate text-gold">
                  {crumb.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
