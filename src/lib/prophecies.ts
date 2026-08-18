/**
 * The prophecy archive.
 *
 * Each record is a published ministry recording held with its own
 * provenance. The design is strict about this and so is the shape below:
 * the *source* (the recording and its publication date), the *event*
 * (independent records of what followed), and the ministry's
 * *interpretation* are three separate fields, and the templates never
 * render them as one another.
 *
 * `fulfilled` is the ministry's own designation of a record, not an
 * independent verdict — the record page says so where it is shown.
 *
 * Dates that have not yet been checked against the source read
 * "DATE TO CONFIRM" rather than being guessed.
 */

export interface TimelineEvent {
  /** "JUL 16" — as published. */
  date: string
  title: string
  detail: string
}

export interface IndependentRecord {
  /** The body that published it — never the ministry. */
  org: string
  detail: string
  href?: string
}

export interface ProphecyRecord {
  id: string
  /** Year for the timeline rail; "—" when the date is unconfirmed. */
  year: string
  /** "JULY 16, 2026" — the dateline as published. */
  date: string
  title: string
  summary: string
  tags: string[]
  /** YouTube id of the original recording — the primary source. */
  video: string
  location: string
  subject: string
  /** Record ID, or "TO BE ASSIGNED" until one is issued. */
  rid: string
  /** ISO date, or "To confirm". */
  published: string
  /** The ministry's own designation. */
  fulfilled: boolean
  timeline: TimelineEvent[]
  /** Published records from bodies other than the ministry. */
  independent: IndependentRecord[]
}

export const prophecyRecords: ProphecyRecord[] = [
  {
    id: 'colombia',
    year: '2026',
    date: 'JULY 16, 2026',
    title: 'Prophecy of a Massive Earthquake Coming to Colombia',
    summary:
      'Recorded and published July 16, 2026. The record holds the original video, its publication date, location and subject, with space for transcript and independent documentation as they are supplied.',
    tags: ['Colombia', 'Earthquake', 'Video'],
    video: 'eabI8bTA9l8',
    location: 'Colombia',
    subject: 'Earthquake',
    rid: 'PR-2026-0716-CO',
    published: '2026-07-16',
    fulfilled: true,
    timeline: [
      {
        date: 'JUL 16',
        title: 'Original prophecy published',
        detail:
          'Source: official ministry recording, embedded above. Further entries are added only as sourced material is supplied.',
      },
    ],
    independent: [],
  },
  {
    id: 'venezuela',
    year: '—',
    date: 'DATE TO CONFIRM',
    title: 'The Terrible Prophet of the Lord Strikes Venezuela With Two Dreadful Earthquakes',
    summary:
      'Original recording concerning two earthquakes in Venezuela. Publication date to confirm against the source.',
    tags: ['Venezuela', 'Earthquake', 'Video'],
    video: 'Gcfq86Qx6nc',
    location: 'Venezuela',
    subject: 'Earthquake',
    rid: 'TO BE ASSIGNED',
    published: 'To confirm',
    fulfilled: true,
    timeline: [
      {
        date: '—',
        title: 'Original prophecy published',
        detail:
          'Source: official ministry recording, embedded above. The publication date is to be confirmed against the source before it is set down here.',
      },
    ],
    independent: [],
  },
  {
    id: 'asia',
    year: '2024',
    date: 'SEPTEMBER 2, 2024',
    title: 'Prophecy of a Massive 8.8 Earthquake Coming to Asia',
    summary:
      'Original recording published September 2, 2024, naming the magnitude before the event. Held with its publication date, location, and subject.',
    tags: ['Asia', 'Earthquake', 'Video'],
    video: 'BY4PpYP8jv4',
    location: 'Asia',
    subject: 'Earthquake',
    rid: 'PR-2024-0902-AS',
    published: '2024-09-02',
    fulfilled: true,
    timeline: [
      {
        date: 'SEP 2',
        title: 'Original prophecy published',
        detail:
          'Source: official ministry recording, embedded above. Further entries are added only as sourced material is supplied.',
      },
    ],
    independent: [],
  },
  {
    id: 'chile',
    year: '—',
    date: 'DATE TO CONFIRM',
    title: 'Chile Earthquake Prophecy — 8.8 Magnitude',
    summary:
      'Original recording naming Chile and the magnitude. Publication date to confirm against the source.',
    tags: ['Chile', 'Earthquake', 'Video'],
    video: 'w9ROSHjmkIE',
    location: 'Chile',
    subject: 'Earthquake',
    rid: 'TO BE ASSIGNED',
    published: 'To confirm',
    fulfilled: true,
    timeline: [
      {
        date: '—',
        title: 'Original prophecy published',
        detail:
          'Source: official ministry recording, embedded above. The publication date is to be confirmed against the source before it is set down here.',
      },
    ],
    independent: [],
  },
  {
    id: 'mexico',
    year: '—',
    date: 'DATE TO CONFIRM',
    title: 'Prophecy of the Historic Mexico Earthquake Dreadfully Fulfilled',
    summary:
      "Original recording concerning Mexico, published with the ministry's account of the event that followed. Publication date to confirm against the source.",
    tags: ['Mexico', 'Earthquake', 'Video'],
    video: 'MJjDG6SSAaw',
    location: 'Mexico',
    subject: 'Earthquake',
    rid: 'TO BE ASSIGNED',
    published: 'To confirm',
    fulfilled: true,
    timeline: [
      {
        date: '—',
        title: 'Original prophecy published',
        detail:
          'Source: official ministry recording, embedded above. The publication date is to be confirmed against the source before it is set down here.',
      },
    ],
    independent: [],
  },
]

export const recordById = (id: string): ProphecyRecord | undefined =>
  prophecyRecords.find((record) => record.id === id)

/* The embed and the poster frame come from lib/youtube, which the article
   renderer shares — there is one way to build a YouTube URL here. */
export { embedSrc, posterSrc } from '@/lib/youtube'

export const recordHref = (record: Pick<ProphecyRecord, 'id'>): string =>
  `/prophecies/${record.id}`

/**
 * The fulfilled records, newest first, for the rail beside a teaching.
 *
 * A record whose publication date has not been checked against the source
 * sorts last rather than being given a guessed date to sort by: the whole
 * point of the archive is that the date a thing was said is the claim, so
 * an unconfirmed one cannot be allowed to sit at the top of a list that
 * reads as newest-first.
 */
export function recentlyFulfilled(limit = 4): ProphecyRecord[] {
  const dated = (record: ProphecyRecord) =>
    /^\d{4}-\d{2}-\d{2}$/.test(record.published) ? record.published : ''
  return prophecyRecords
    .filter((record) => record.fulfilled)
    .slice()
    .sort((a, b) => dated(b).localeCompare(dated(a)))
    .slice(0, limit)
}

/** The scripture cards that stand beside every record. */
export const recordScriptures = [
  { text: '“But of that day and hour knoweth no man…”', ref: 'Matthew 24:36' },
  { text: '“And there shall be earthquakes in divers places…”', ref: 'Mark 13:8' },
  {
    text: '“Surely the Lord God will do nothing, but he revealeth his secret unto his servants the prophets.”',
    ref: 'Amos 3:7',
  },
]
