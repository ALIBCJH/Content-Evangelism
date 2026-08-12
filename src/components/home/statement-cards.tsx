import * as React from 'react'
import Link from 'next/link'
import { missionStatement, visionStatement, type Statement } from '@/lib/content'

/** The vision and the mission, each with the Scriptures it is drawn from. */
function StatementCard({ statement }: { statement: Statement }) {
  return (
    <Link
      href="/about"
      className="card card-interactive flex flex-col p-6 sm:p-10"
    >
      <p className="kicker mb-4 text-gold">{statement.kicker}</p>
      <h3 className="mb-4 font-display text-[1.625rem] font-medium leading-[1.12] text-navy sm:text-[2.125rem]">
        {statement.title}
      </h3>
      <p className="mb-6 flex-1 text-[0.9375rem] leading-[1.75] text-ink-700">{statement.body}</p>
      <p className="flex flex-wrap gap-2 border-t border-rule-soft pt-[18px]">
        {statement.refs.map((ref) => (
          <span key={ref} className="chip">
            {ref}
          </span>
        ))}
      </p>
    </Link>
  )
}

export function StatementCards() {
  return (
    <section className="shell grid gap-6 pb-20 pt-16 md:grid-cols-2 lg:pb-24 lg:pt-[72px]">
      <h2 className="sr-only">The vision and mission of the ministry</h2>
      <StatementCard statement={visionStatement} />
      <StatementCard statement={missionStatement} />
    </section>
  )
}
