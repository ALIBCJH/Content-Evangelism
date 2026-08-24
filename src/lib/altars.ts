import { counties, type Altar, type County } from '@/lib/content'
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
