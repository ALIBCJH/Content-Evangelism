import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { authors } from '@/lib/content'
import { AuthorAvatar } from '@/components/byline'
import { SectionHeading } from '@/components/section-heading'
import { Stagger, StaggerItem } from '@/components/motion'

export function Voices() {
  return (
    <section id="voices" aria-label="Authors" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <SectionHeading
        kicker="The bylines"
        title="Voices of the Herald"
        lede="Pastors, theologians, historians, and watchmen — the people who keep this desk."
        href="#voices"
        hrefLabel="All contributors"
      />
      <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {authors.map((author) => (
          <StaggerItem key={author.id}>
            <Link href={`#author-${author.id}`} className="group block h-full">
              <article className="card card-interactive flex h-full flex-col items-start !rounded-2xl p-6">
                <AuthorAvatar name={author.name} className="h-14 w-14 text-base" />
                <h3 className="mt-5 font-display text-lg font-semibold leading-tight text-ink-strong">
                  {author.name}
                </h3>
                <p className="kicker mt-1.5 text-gold">{author.role}</p>
                <p className="mt-3 flex-1 font-serif text-sm leading-relaxed text-ink-muted">
                  {author.bio}
                </p>
                <p className="mt-5 flex items-center gap-2 font-sans text-[0.6875rem] font-bold uppercase tracking-kicker text-ink-subtle transition-colors group-hover:text-gold">
                  <span className="tabular">{author.articles} pieces</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </p>
              </article>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
