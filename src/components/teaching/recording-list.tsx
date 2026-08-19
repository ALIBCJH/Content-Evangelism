'use client'

import * as React from 'react'
import type { TeachingRecording } from '@/lib/teachings'
import { byScore, score } from '@/lib/search-docs'
import { DatedRail, DatedRailItem } from '@/components/archive/dated-rail'
import { SearchSummary, SectionSearch } from '@/components/archive/section-search'
import { RecordingCard } from '@/components/teaching/recording-card'

/**
 * The recordings on their dated rail.
 *
 * This exists as a client component for one reason: something has to know
 * which recording is open, and it cannot be the card. Two sermons playing
 * over one another is the failure a page of embeds falls into, so opening
 * one closes the last.
 *
 * The rail itself is unchanged from the prophecy archive's — the year
 * prints only where it changes, and a recording whose date is still to be
 * confirmed leaves its marker unlabelled rather than claiming one.
 *
 * It also carries the box that searches the recordings, in the band above
 * them, for the same reason the other two archives do: a reader standing
 * on this shelf should not have to leave it to find what is on it. The
 * conference, the place, the passage and the date are all searchable, not
 * only the title.
 */
export function RecordingList({
  recordings,
  header,
}: {
  recordings: TeachingRecording[]
  /** The band's title, rendered on the server and handed in. */
  header?: React.ReactNode
}) {
  const [playingId, setPlayingId] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState('')

  const shown = React.useMemo(() => {
    if (!query.trim()) return recordings
    return byScore(recordings, (recording) =>
      score(query, [
        { text: recording.title, weight: 10 },
        { text: recording.place ?? '', weight: 8 },
        { text: recording.series ?? '', weight: 7 },
        { text: recording.scripture ?? '', weight: 7 },
        { text: recording.date, weight: 5 },
        { text: recording.summary ?? '', weight: 3 },
      ])
    )
  }, [recordings, query])

  return (
    <>
      {header !== undefined && (
        <section className="border-b border-rule bg-raised">
          <div className="shell flex flex-wrap items-center gap-x-4 gap-y-4 py-5 sm:gap-x-8">
            {header}
            <SectionSearch
              value={query}
              onChange={setQuery}
              label="Search the recorded teachings"
            />
          </div>
        </section>
      )}

      <div className="shell pt-10">
      <SearchSummary
        query={query}
        count={shown.length}
        noun="recording"
        onClear={() => setQuery('')}
      />

      {shown.length === 0 ? (
        <p className="rounded-panel border border-rule bg-card px-6 py-10 text-center text-[0.9375rem] text-ink-muted">
          No recording matches &ldquo;{query.trim()}&rdquo;. The library holds{' '}
          {recordings.length} in all.
        </p>
      ) : (
    <DatedRail>
      {shown.map((recording, index) => {
        const previous = shown[index - 1]
        const first = recording.year !== null && previous?.year !== recording.year
        return (
          <DatedRailItem key={recording.id} year={first ? recording.year : null}>
            <RecordingCard
              recording={recording}
              playing={playingId === recording.id}
              onPlay={() => setPlayingId(recording.id)}
            />
          </DatedRailItem>
        )
      })}
    </DatedRail>
      )}
      </div>
    </>
  )
}
