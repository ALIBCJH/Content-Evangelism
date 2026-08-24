import { counties, type Altar, type County } from '@/lib/content'
import { countyShapes } from '@/lib/county-map'
import { byScore, score } from '@/lib/search-docs'

/**
 * The altars, as the finder needs them.
 *
 * The About page held this as one flat list of cards and nothing else,
 * which answers "how many counties does the ministry meet in" and not the
 * question a reader actually arrives with, which is "where do I go on
 * Sunday". Everything here exists to answer that one: the counties that
 * can be gone to, the counties that cannot yet, and a search that matches
 * whatever the reader happens to know — the county, the altar's name, the
 * road it is on, or the number the clergy published.
 *
 * Deliberately free of any server import, so the finder can run in the
 * browser without dragging the article store in behind it.
 */

/** Counties with an altar recorded, in the order the Constitution numbers them. */
export const locatedCounties: County[] = counties.filter((county) => county.altars?.length)

/** Counties the ministry gathers in whose meeting place we do not have. */
export const awaitingCounties: County[] = counties.filter((county) => !county.altars?.length)

/** Every altar recorded, across every county. */
export const allAltars: Altar[] = locatedCounties.flatMap((county) => county.altars ?? [])

/** How many altars this county holds. Laikipia holds two. */
export const altarsIn = (county: County): number => county.altars?.length ?? 0

/** The number as it is printed everywhere on the site: 01, 09, 47. */
export const countyNumber = (no: number): string => String(no).padStart(2, '0')

/** Where a county's card lives, so the map can send a reader to it. */
export const countyCardId = (no: number): string => `county-${no}`

/**
 * The counties a query is asking for.
 *
 * A reader searching this page knows one of four things: the county, the
 * altar's name, roughly where it is, or a number they were given. All
 * four are matched, weighted in that order, by the same scorer the rest
 * of the site searches with — so "mtwapa" finds Kilifi and "main altar"
 * does not simply return everything in declaration order.
 */
export function searchCounties(pool: County[], query: string): County[] {
  if (!query.trim()) return pool

  return byScore(pool, (county) => {
    const altars = county.altars ?? []
    return score(query, [
      { text: county.name, weight: 10 },
      { text: altars.map((altar) => altar.name).join(' · '), weight: 8 },
      { text: altars.map((altar) => altar.area).join(' · '), weight: 7 },
      { text: countyNumber(county.no), weight: 5 },
      { text: altars.map((altar) => altar.phone ?? '').join(' '), weight: 4 },
    ])
  })
}

/**
 * The Place the search engines are told about, one per altar.
 *
 * The coordinates and the Google place are the ministry's own — the same
 * two the card's link is built from — so the pin a search result offers
 * is the pin the ministry named.
 */
export function altarPlaceData(county: County, altar: Altar, mapHref: string) {
  return {
    '@type': 'Church',
    name: altar.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: altar.area,
      addressRegion: `${county.name} County`,
      addressCountry: 'KE',
    },
    geo: { '@type': 'GeoCoordinates', latitude: altar.at[0], longitude: altar.at[1] },
    ...(altar.phone ? { telephone: altar.phone.replace(/\s/g, '') } : {}),
    hasMap: mapHref,
  }
}

/* ── One altar, at its own address ───────────────────────────────── */

/**
 * A name as a URL says it: "Trans Nzoia" → "trans-nzoia".
 *
 * The one rule beyond stripping punctuation: a county called "<name>
 * City" gives up the word. The county's formal name is Nairobi City; the
 * place everyone types is Nairobi, and the URL should be the second.
 */
const slugify = (value: string): string =>
  value
    .replace(/\s+City$/i, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** The town in "Kenyatta St, Kitale" — what a reader would call the place. */
const townOf = (altar: Altar): string => altar.area.split(',').pop()?.trim() ?? altar.area

export interface AltarEntry {
  county: County
  altar: Altar
  /** The last segment of the altar's own URL. */
  slug: string
}

/**
 * Every altar, with the address its page lives at.
 *
 * The slug is the county, because that is what a reader types — "nakuru",
 * not "repentance-and-holiness-ministry-nakuru-main-altar". Where a county
 * holds more than one altar the town is added to tell them apart, which is
 * how the ministry itself names them: Laikipia gathers at Nanyuki and at
 * Nyahururu. Nothing here is hand-written, so an altar added to the data
 * gets its page without anyone remembering to mint a slug for it — and
 * `tests/altars.test.ts` holds the rule that two can never collide.
 */
export const altarEntries: AltarEntry[] = locatedCounties.flatMap((county) => {
  const altars = county.altars ?? []
  const base = slugify(county.name)

  return altars.map((altar) => {
    if (altars.length === 1) return { county, altar, slug: base }
    const town = slugify(townOf(altar))
    return {
      county,
      altar,
      slug: town && town !== base ? `${base}-${town}` : `${base}-${slugify(altar.name)}`,
    }
  })
})

/** Where an altar's own page lives. */
export const altarPath = (entry: AltarEntry): string => `/altars/${entry.slug}`

/** The altar a URL is asking for, or nothing. */
export const altarBySlug = (slug: string): AltarEntry | undefined =>
  altarEntries.find((entry) => entry.slug === slug)

/** The entries for one county, in the order the ministry lists them. */
export const entriesIn = (county: County): AltarEntry[] =>
  altarEntries.filter((entry) => entry.county.no === county.no)

/* ── How far apart two altars are ────────────────────────────────── */

const EARTH_KM = 6371

/**
 * Kilometres between two points, as the crow flies.
 *
 * Straight-line rather than by road, and rounded, because it is answering
 * "is there something closer than this" and not "how long will it take" —
 * a page that cannot see the Nakuru road should not imply that it can.
 */
export function distanceKm([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/**
 * The altars closest to this one, nearest first.
 *
 * Its own county is left out, not only itself: a detail page already
 * lists what else the county holds, and a rail that repeats Nanyuki under
 * "nearest" two inches below "also in Laikipia" is spending a reader's
 * attention on something they have just read.
 */
export function nearestEntries(to: AltarEntry, limit = 4): { entry: AltarEntry; km: number }[] {
  return altarEntries
    .filter((entry) => entry.county.no !== to.county.no)
    .map((entry) => ({ entry, km: distanceKm(to.altar.at, entry.altar.at) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)
}

/* ── The county, drawn on its own ────────────────────────────────── */

/**
 * The window onto one county, in the drawing's coordinates.
 *
 * The paths hold nothing but move-tos and line-tos, so every number in
 * one is a coordinate and the pairs are the outline. A detail page shows
 * the country zoomed to the county rather than the whole of Kenya: at the
 * size the inset is drawn, a pin somewhere in a whole country is a pin
 * nobody can place, and the neighbours still show at the edges to say
 * where in the country this is.
 */
export function countyViewBox(no: number, padding = 0.45): string {
  const shape = countyShapes.find((candidate) => candidate.no === no)
  if (!shape) return '0 0 1000 1000'

  const numbers = (shape.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  let west = Infinity
  let east = -Infinity
  let north = Infinity
  let south = -Infinity
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    west = Math.min(west, numbers[i])
    east = Math.max(east, numbers[i])
    north = Math.min(north, numbers[i + 1])
    south = Math.max(south, numbers[i + 1])
  }

  /* Squared off, so the inset never stretches a county that happens to be
     long and thin — Kajiado and Vihiga are drawn to the same rules. */
  const side = Math.max(east - west, south - north) * (1 + padding * 2)
  const x = (west + east) / 2 - side / 2
  const y = (north + south) / 2 - side / 2
  return `${x.toFixed(1)} ${y.toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}`
}
