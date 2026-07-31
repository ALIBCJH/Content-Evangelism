import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Feather } from 'lucide-react'
import { categoryFromSlug, categoryMeta } from '@/lib/content'
import { listRealRows } from '@/lib/rows'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ArticleCard } from '@/components/article-card'
import { buttonVariants } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface Params {
  params: { slug: string }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const category = categoryFromSlug(params.slug)
  if (!category) return { title: 'Section not found' }
  return { title: category, description: categoryMeta[category].description }
}

export default async function CategoryPage({ params }: Params) {
  const category = categoryFromSlug(params.slug)
  if (!category) notFound()

  const rows = (await listRealRows()).filter((row) => row.category === category)

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 md:pb-28 lg:px-8">
        <div className="border-b-2 border-hairline-strong pb-4">
          <p className="kicker text-gold">The desk</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink-strong md:text-4xl">
            {category}
          </h1>
          <p className="mt-2 max-w-xl font-serif text-base text-ink-muted">
            {categoryMeta[category].description}
          </p>
        </div>

        {rows.length === 0 ? (
          /* Honest empty state — no filler in the sections. */
          <div className="mx-auto max-w-md py-24 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-gold/10">
              <Feather className="h-6 w-6 text-gold" strokeWidth={1.5} />
            </span>
            <h2 className="mt-6 font-display text-2xl font-semibold text-ink-strong">
              The desk has not yet published here.
            </h2>
            <p className="mt-3 font-serif text-base leading-relaxed text-ink-muted">
              {category} pieces will appear on this page the moment they are
              published. In the meantime, the reading room is open.
            </p>
            <Link href="/articles" className={buttonVariants({ variant: 'outline', className: 'mt-8' })}>
              Browse all articles
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <ArticleCard key={row.slug} row={row} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
