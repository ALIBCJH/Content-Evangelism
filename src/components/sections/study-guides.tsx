import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Download, GraduationCap } from 'lucide-react'
import { studyGuides } from '@/lib/content'
import { ArticleArt } from '@/components/article-art'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/section-heading'
import { Stagger, StaggerItem } from '@/components/motion'

const levelVariant = {
  Foundations: 'flagship',
  Growing: 'gold',
  'Deep Study': 'orchid',
} as const

export function StudyGuides() {
  return (
    <section id="guides" aria-label="Bible study guides" className="border-y border-hairline bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="For the small group & the study desk"
          title="Bible Study Guides"
          lede="Structured companions for personal devotion and group study — with session outlines, questions, and prayer prompts."
          href="#guides"
          hrefLabel="All guides"
        />
        <Stagger className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {studyGuides.map((guide) => (
            <StaggerItem key={guide.slug}>
              <article className="card card-interactive flex h-full flex-col overflow-hidden !rounded-2xl">
                <ArticleArt
                  art={guide.art}
                  className="aspect-[21/9]"
                  sealClassName="h-12 w-12"
                  iconClassName="h-5 w-5"
                />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={levelVariant[guide.level]} size="sm">{guide.level}</Badge>
                    <p className="flex items-center gap-1.5 font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span className="tabular">{guide.sessions} sessions</span>
                    </p>
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-semibold leading-tight text-ink-strong">
                    {guide.title}
                  </h3>
                  <p className="mt-1.5 font-sans text-[0.6875rem] font-bold uppercase tracking-kicker text-gold">
                    {guide.scripture}
                  </p>
                  <p className="mt-3 flex-1 font-serif text-sm leading-relaxed text-ink-muted">
                    {guide.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-hairline pt-5">
                    <Link
                      href={`#guide-${guide.slug}`}
                      className="group inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-kicker text-ink transition-colors hover:text-gold"
                    >
                      Begin the study
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <button
                      type="button"
                      aria-label={`Download the ${guide.title} guide as PDF`}
                      className="focus-ring icon-only grid h-9 w-9 place-items-center rounded-full border border-hairline text-ink-subtle transition-colors hover:border-gold/50 hover:text-gold"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
