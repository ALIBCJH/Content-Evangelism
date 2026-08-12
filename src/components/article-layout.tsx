import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Cross } from 'lucide-react'
import { topicHref, type Category } from '@/lib/content'
import type { RealRow } from '@/lib/rows'
import type { Heading } from '@/lib/toc'
import { ArticleContents } from '@/components/article-contents'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ContinueReading } from '@/components/continue-reading'
import { FadeIn } from '@/components/motion'
import { ReadingProgress } from '@/components/progress-bar'
import { ShareRow } from '@/components/share-row'
import { StudyMargin } from '@/components/study-margin'

/**
 * One article page, for every article.
 *
 * There are two routes that render a teaching — the posted articles at
 * /articles/[slug] and the hand-set piece at /articles/the-cross-of-jesus
 * — and they had drifted into two different designs: different headline
 * weights, one with a byline component and one without, and a study
 * margin on only one of them. The routes stay exactly as they are; what
 * they share is this shell, so a change to how a teaching is presented is
 * made once and both pages are it.
 *
 * The layout is three zones on a wide screen: the reading companion on
 * the left, the teaching in the middle, and a matching empty column on
 * the right so the text stays optically centred in the viewport. The
 * right column is deliberately empty — pushing related links into it
 * narrows the reading column, and the reading column is the product.
 */

export interface ArticleLayoutProps {
  category: Category
  title: string
  /** The standfirst: what this teaching is about, in one or two sentences. */
  dek: string
  /** `href` is omitted for a byline with no author page behind it. */
  author: { name: string; href?: string }
  publishedAt: string
  readMinutes: number
  hero?: { src: string; alt: string; caption?: string }
  /** Chapters, for the study margin and the in-flow contents list. */
  headings: Heading[]
  /** What to read next — see `relatedRows`. */
  related: RealRow[]
  /** Set at the close, above the ornament: a scripture list, a note. */
  colophon?: React.ReactNode
  /** The body of the teaching. */
  children: React.ReactNode
}

export function ArticleLayout({
  category,
  title,
  dek,
  author,
  publishedAt,
  readMinutes,
  hero,
  headings,
  related,
  colophon,
  children,
}: ArticleLayoutProps) {
  return (
    <>
      <ReadingProgress />
      <main className="xl:mx-auto xl:grid xl:max-w-[88rem] xl:grid-cols-[15rem_minmax(0,1fr)_15rem] xl:gap-6 xl:px-8">
        {/* The study margin fills the once-empty left column on desktop. */}
        <aside className="hidden xl:block" aria-label="Study margin">
          <div className="sticky top-24 pt-10">
            <StudyMargin headings={headings} title={title} />
          </div>
        </aside>

        {/* An article is printed on cloth, the way the archive shows it. */}
        <article className="cloth mx-auto my-6 w-full max-w-[52rem] px-5 pb-16 pt-10 sm:px-10 md:my-10 md:pb-20">
          <FadeIn>
            <header className="text-center">
              <Breadcrumbs className="mb-6" crumbs={[
                { name: 'Archive', href: '/' },
                { name: category, href: topicHref(category) },
                { name: title },
              ]} />

              {/* The section, as a kicker rather than a pill. A badge sat
                  in the title's light; a small caps line hands off to it. */}
              <Link
                href={topicHref(category)}
                className="focus-ring kicker inline-block text-gold transition-colors hover:text-ink"
              >
                {category}
              </Link>

              <h1 className="mx-auto mt-4 max-w-measure text-balance font-display text-[2.1rem] font-normal leading-[1.08] tracking-[-0.018em] text-ink-strong sm:text-[2.6rem] md:text-[3.1rem]">
                {title}
              </h1>

              <p className="mx-auto mt-6 max-w-[38rem] text-pretty font-display text-[1.2rem] font-light italic leading-[1.5] text-ink-muted sm:text-[1.35rem]">
                {dek}
              </p>

              {/* Metadata is the quietest line in the header: one size,
                  one colour, the name the only part set in ink. */}
              <p className="mt-7 font-sans text-[0.8125rem] text-ink-subtle">
                {author.href ? (
                  <Link
                    href={author.href}
                    rel="author"
                    className="font-medium text-ink-muted transition-colors hover:text-gold"
                  >
                    {author.name}
                  </Link>
                ) : (
                  <span className="font-medium text-ink-muted">{author.name}</span>
                )}
                <span aria-hidden className="mx-2 text-hairline-strong">·</span>
                <time dateTime={publishedAt}>
                  {format(parseISO(publishedAt), 'd MMMM yyyy')}
                </time>
                <span aria-hidden className="mx-2 text-hairline-strong">·</span>
                <span className="tabular">{readMinutes} min read</span>
              </p>

              <ShareRow title={title} className="mt-6" />
            </header>

            {hero && (
              /* Full-bleed to the edges of the cloth. Inset inside a
                 border it read as an illustration dropped into the page;
                 carried to the edge it reads as the page. */
              <figure className="-mx-5 mt-10 sm:-mx-10">
                <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
                  <Image
                    src={hero.src}
                    /* What the photograph shows — not the headline again,
                       which tells a screen reader and image search nothing
                       the h1 above has not already said. */
                    alt={hero.alt}
                    fill
                    priority
                    sizes="(min-width: 1280px) 52rem, (min-width: 640px) 90vw, 100vw"
                    className="object-cover"
                  />
                </div>
                {hero.caption && (
                  <figcaption className="mx-auto mt-3 max-w-measure px-5 text-center font-sans text-xs leading-snug text-ink-subtle sm:px-0">
                    {hero.caption}
                  </figcaption>
                )}
              </figure>
            )}
          </FadeIn>

          <div className="mx-auto mt-12 max-w-measure">
            {/* The chapter list, for every width the study margin does not
                reach. Above the body, so it is read before the teaching
                rather than found after it. */}
            <ArticleContents
              headings={headings}
              className="mb-12 border-y border-hairline-strong py-6 xl:hidden"
            />

            {children}

            <div className="mt-16 border-t border-hairline pt-8">
              {colophon}
              <div className="ornament mx-auto mt-8 max-w-xs">
                <Cross className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <ShareRow title={title} className="mt-8" />
              <div className="mt-10 text-center">
                <Link
                  href="/"
                  className="group inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-kicker text-ink-muted transition-colors hover:text-gold"
                >
                  <ArrowLeft
                    aria-hidden
                    className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1"
                  />
                  Back to the archive
                </Link>
              </div>
            </div>

            <ContinueReading rows={related} category={category} />
          </div>
        </article>

        {/* Right spacer mirrors the rail so the reading column stays centered. */}
        <div aria-hidden className="hidden xl:block" />
      </main>
    </>
  )
}
