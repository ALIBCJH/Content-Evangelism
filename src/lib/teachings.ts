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
 * Dates follow that rule too. A date is set here only where the ministry
 * itself stated it — in the recording's own title, or alongside it. Where
 * it has not been checked against the source the entry reads
 * "DATE TO CONFIRM" and its marker on the rail goes unlabelled, exactly as
 * an unconfirmed prophecy record does. A guessed date would be worse than
 * no date on a page whose whole claim is that it holds the record.
 *
 * Titles are the ministry's own, with their case normalised — YouTube
 * titles are set in capitals, and the site is not.
 */

export interface TeachingRecording {
  id: string
  /** YouTube id of the recording. */
  video: string
  title: string
  /** The dateline as the ministry published it, or "DATE TO CONFIRM". */
  date: string
  /** Year for the rail; null leaves the marker unlabelled. */
  year: string | null
  /** Where it was preached, when the ministry stated it. */
  place?: string
  /** The conference or series it belongs to. */
  series?: string
  /** The passage it is preached from, when the title names one. */
  scripture?: string
  /** What the recording is, in one or two sentences. */
  summary?: string
}

export const teachingRecordings: TeachingRecording[] = [
  {
    id: 'church-age-coming-to-an-end',
    video: 'Li2d_bBXY3I',
    title: 'Special Teaching on the Church Age Coming to an End',
    date: 'AUGUST 8, 2026',
    year: '2026',
    place: 'The Headquarters',
    series: 'Conference',
    summary:
      'A full teaching, delivered at a conference at the ministry headquarters, on the theme that the age of the Church is closing and the return of the Messiah is imminent — the ministry’s central call to prepare the way. Published 13 August 2026.',
  },
  {
    id: 'global-conference-bogota',
    video: 'Gg1m8-4JrAc',
    title: 'Global Conference on the Coming of the Messiah',
    date: 'JULY 17, 2026',
    year: '2026',
    place: 'Bogotá, Colombia',
    series: 'Global Conference',
  },
  {
    id: 'long-suffering-comes-to-an-end',
    video: 'E9XaBmRwdDQ',
    title: 'Stern Warning That the Long-Suffering of God Comes to an End',
    date: 'DATE TO CONFIRM',
    year: null,
    series: 'Menengai 7',
  },
  {
    id: 'promise-of-glorification',
    video: 'O0Yw0HKTc1k',
    title: 'The Promise of Glorification to the Holy Church at Rapture',
    date: 'DATE TO CONFIRM',
    year: null,
    series: 'Menengai 7',
  },
  {
    id: 'citizenship-not-of-this-earth',
    video: 'L9QItCWGrCE',
    title: 'Our Citizenship Is Not of This Earth',
    date: 'DATE TO CONFIRM',
    year: null,
    scripture: 'Philippians 3:20–21',
  },
  {
    id: 'glorious-coming-of-the-kingdom',
    video: 'XXGZlIEAtCY',
    title: 'The Glorious Coming of the Kingdom of God',
    date: 'DATE TO CONFIRM',
    year: null,
  },
  {
    id: 'earthquakes-gods-wrath-against-sin',
    video: 'R8efzMPqZSE',
    title: 'Earthquakes: God’s Wrath Against Sin',
    date: 'DATE TO CONFIRM',
    year: null,
  },
]
