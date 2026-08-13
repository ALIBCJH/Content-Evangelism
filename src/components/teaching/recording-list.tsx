'use client'

import * as React from 'react'
import type { TeachingRecording } from '@/lib/teachings'
import { DatedRail, DatedRailItem } from '@/components/archive/dated-rail'
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
 */
export function RecordingList({ recordings }: { recordings: TeachingRecording[] }) {
  const [playingId, setPlayingId] = React.useState<string | null>(null)

  return (
    <DatedRail>
      {recordings.map((recording, index) => {
        const previous = recordings[index - 1]
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
  )
}
