import * as React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { siteUrl } from '@/lib/content'
import { JsonLd } from '@/components/json-ld'

export interface Crumb {
  name: string
  /** Site-relative path; omitted on the final (current-page) crumb. */
  href?: string
}

/**
 * Visible breadcrumb trail + matching BreadcrumbList structured data.
 * Google reads the JSON-LD for the result-page trail; the visible nav is
 * the mobile-friendly affordance that must agree with it.
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
      <nav aria-label="Breadcrumb" className={`font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle ${className}`}>
        <ol className="flex flex-wrap items-center justify-center gap-1.5">
          {crumbs.map((crumb, index) => (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight aria-hidden className="h-3 w-3 text-ink-subtle/60" />}
              {crumb.href ? (
                <Link href={crumb.href} className="py-1 transition-colors hover:text-gold">
                  {crumb.name}
                </Link>
              ) : (
                <span aria-current="page" className="max-w-[14rem] truncate text-ink-muted">
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
