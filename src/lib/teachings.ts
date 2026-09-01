/**
 * Recorded teachings.
 *
 * Every entry is a recording the ministry itself published, on its own
 * YouTube channel — which is why these are attributed to the ministry and
 * to Prophet Dr. David Owuor, where the holiness Short embedded in an
 * article is credited to the channel that uploaded it instead. The rule
 * is the same one the prophecy archive runs on: provenance is never
 * blurred, so what a thing is and who published it are recorded, not
 * assumed.
 *
 * Dates follow that rule, and `dated` is how. Where the ministry stated
 * when a teaching was preached — in the recording's own title, or by
 * streaming it live on the day — the dateline is that day and `dated` is
 * `preached`. Where it did not, the only date on record is the day the
 * ministry put the recording on its channel, and the dateline says so in
 * as many words. Nothing here is inferred from anything else: a guessed
 * date would be worse than no date on a page whose whole claim is that it
 * holds the record.
 *
 * Runtimes are the upload's own, to the second. They are not decoration.
 * A reader deciding whether to open a sermon is asking one question first
 * and it is how long this is, and the answer separates a four-hour
 * conference from a six-minute message — which is the difference between
 * two things this page would otherwise show as one.
 *
 * Titles are the ministry's own, with their case normalised — YouTube
 * titles are set in capitals, and the site is not.
 */

export interface TeachingRecording {
  id: string
  /** YouTube id of the recording. */
  video: string
  title: string
  /** The dateline, set in the site's capitals. */
  date: string
  /**
   * Which day the dateline is: the day it was preached, where the
   * ministry stated it, or the day the ministry published it, where that
   * is the only day on record.
   */
  dated: 'preached' | 'published'
  /** Year for the rail. */
  year: string
  /** Runtime in seconds, as the ministry's own upload reports it. */
  seconds: number
  /**
   * The exact instant the ministry published it, as its own channel
   * reports it. Search engines want this for a video, and the dateline
   * above is derived from it wherever `dated` is `published`.
   */
  uploaded: string
  /** Where it was preached, when the ministry stated it. */
  place?: string
  /** The conference or series it belongs to. */
  series?: string
  /** The passage it is preached from, when the title names one. */
  scripture?: string
  /**
   * What the recording is, in one or two sentences. Required, and that is
   * deliberate: six of these seven once had none, and a card with a
   * headline and nothing under it is the shape of a page that has not
   * been finished. It is also what a search result shows.
   */
  summary: string
}

/** Newest first — the order the rail prints them in. */
export const teachingRecordings: TeachingRecording[] = [
  {
    id: 'church-age-coming-to-an-end',
    video: 'Li2d_bBXY3I',
    title: 'Special Teaching on the Church Age Coming to an End',
    date: 'AUGUST 8, 2026',
    dated: 'preached',
    year: '2026',
    seconds: 6932,
    uploaded: '2026-08-12T21:37:50-07:00',
    place: 'The Headquarters',
    series: 'Conference',
    summary:
      'A full teaching, delivered at a conference at the ministry headquarters, on the theme that the age of the Church is closing and the return of the Messiah is imminent — the ministry’s central call to prepare the way.',
  },
  {
    id: 'global-conference-bogota',
    video: 'Gg1m8-4JrAc',
    title: 'Global Conference on the Coming of the Messiah',
    date: 'JULY 17, 2026',
    dated: 'preached',
    year: '2026',
    seconds: 13986,
    uploaded: '2026-07-17T14:58:49-07:00',
    place: 'Bogotá, Colombia',
    series: 'Global Conference',
    summary:
      'The ministry’s global conference on the coming of the Messiah, streamed live from the city of Bogotá — the longest recording held here, and a whole conference in one sitting.',
  },
  {
    id: 'earthquakes-gods-wrath-against-sin',
    video: 'R8efzMPqZSE',
    title: 'Earthquakes: God’s Wrath Against Sin',
    date: 'FEBRUARY 8, 2026',
    dated: 'preached',
    year: '2026',
    seconds: 9493,
    uploaded: '2026-02-08T13:25:22-08:00',
    summary:
      'A live teaching on earthquakes as the wrath of God against sin, streamed by the ministry and since watched more than a million times — by some distance the most heard recording on this shelf.',
  },
  {
    id: 'long-suffering-comes-to-an-end',
    video: 'E9XaBmRwdDQ',
    title: 'Stern Warning That the Long-Suffering of God Comes to an End',
    date: 'FEBRUARY 5, 2025',
    dated: 'published',
    year: '2025',
    seconds: 347,
    uploaded: '2025-02-05T10:15:18-08:00',
    series: 'Menengai 7',
    summary:
      'A short message from the Grand Mega Menengai 7 Conference of Pastors, warning that the long-suffering of God has an end, and that the time to turn is now.',
  },
  {
    id: 'promise-of-glorification',
    video: 'O0Yw0HKTc1k',
    title: 'The Promise of Glorification to the Holy Church at Rapture',
    date: 'FEBRUARY 5, 2025',
    dated: 'published',
    year: '2025',
    seconds: 482,
    uploaded: '2025-02-05T07:44:53-08:00',
    series: 'Menengai 7',
    summary:
      'A short message from the Menengai 7 conference on the glorification promised to the holy Church at the rapture — what the Church is being prepared for, and who it is promised to.',
  },
  {
    id: 'citizenship-not-of-this-earth',
    video: 'L9QItCWGrCE',
    title: 'Our Citizenship Is Not of This Earth',
    date: 'FEBRUARY 4, 2025',
    dated: 'published',
    year: '2025',
    seconds: 425,
    uploaded: '2025-02-04T12:27:46-08:00',
    series: 'Menengai 7',
    scripture: 'Philippians 3:20–21',
    summary:
      'Preached from Philippians 3:20–21 at the Grand Mega Menengai 7 Conference of Pastors: the believer’s citizenship is in heaven, and the life that follows from holding it.',
  },
  {
    id: 'glorious-coming-of-the-kingdom',
    video: 'XXGZlIEAtCY',
    title: 'The Glorious Coming of the Kingdom of God',
    date: 'FEBRUARY 4, 2025',
    dated: 'published',
    year: '2025',
    seconds: 400,
    uploaded: '2025-02-04T08:41:10-08:00',
    series: 'Menengai 7',
    summary:
      'A short message from the Grand Mega Menengai 7 Conference of Pastors on the glorious coming of the kingdom of God, and the Church that is to meet it.',
  },
]

/**
 * The runtime, in the clock form every video player on earth uses —
 * `3:53:06`, `5:47`. A reader does not have to be taught to read it.
 */
export function runtime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`
}

/** The same runtime in words, for the places that are read aloud. */
export function runtimeInWords(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  if (hours === 0) return `${minutes} minutes`
  if (minutes === 0) return hours === 1 ? '1 hour' : `${hours} hours`
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} minutes`
}

/** ISO 8601, which is the only form schema.org accepts for a duration. */
export function isoDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `PT${hours > 0 ? `${hours}H` : ''}${minutes > 0 ? `${minutes}M` : ''}${seconds % 60}S`
}

/** The dateline as a card or a record prints it. */
export const dateline = (recording: TeachingRecording): string =>
  recording.dated === 'published' ? `PUBLISHED ${recording.date}` : recording.date

export const teachingHref = (recording: TeachingRecording): string =>
  `/teachings/${recording.id}`

export const teachingById = (id: string): TeachingRecording | null =>
  teachingRecordings.find((recording) => recording.id === id) ?? null
