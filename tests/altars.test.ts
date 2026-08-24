import { describe, expect, it } from 'vitest'
import { counties } from '@/lib/content'
import {
  allAltars,
  altarBySlug,
  altarEntries,
  altarPath,
  altarPlaceData,
  awaitingCounties,
  countyNumber,
  countyViewBox,
  distanceKm,
  entriesIn,
  locatedCounties,
  nearestEntries,
  searchCounties,
} from '@/lib/altars'
import { buildSearchIndex } from '@/lib/search-index'
import { countyShapes, mapBounds, projectPin } from '@/lib/county-map'
import { searchDocs } from '@/lib/search-docs'

/**
 * The altars page makes two promises a reader acts on: that the county
 * they tapped is the county they are shown, and that the pin they open is
 * the ground the ministry named. Everything here tests one of the two.
 */

describe('the counties, as the page splits them', () => {
  it('accounts for all forty-seven, once each', () => {
    expect(counties).toHaveLength(47)
    expect(locatedCounties.length + awaitingCounties.length).toBe(47)
    expect(new Set(counties.map((county) => county.no)).size).toBe(47)
  })

  it('keeps the order the Constitution numbers them in', () => {
    const numbers = counties.map((county) => county.no)
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b))
  })

  it('counts every altar, not every county', () => {
    /* Laikipia holds two — Nanyuki and Nyahururu — so the two figures
       the page prints are not the same figure. */
    expect(allAltars.length).toBeGreaterThan(locatedCounties.length)
  })
})

describe('searching for a place to go', () => {
  it('finds a county by its own name', () => {
    expect(searchCounties(locatedCounties, 'nakuru').map((c) => c.name)).toContain('Nakuru')
  })

  it('finds a county by the town the altar is in', () => {
    /* The Kilifi altar is at Mtwapa, and "Mtwapa" is what a reader
       standing in it would type. */
    expect(searchCounties(locatedCounties, 'mtwapa')[0]?.name).toBe('Kilifi')
    expect(searchCounties(locatedCounties, 'eldoret')[0]?.name).toBe('Uasin Gishu')
  })

  it('finds a county by the altar the ministry named', () => {
    expect(searchCounties(locatedCounties, 'shiloam')[0]?.name).toBe('Migori')
  })

  it('ranks the county whose name was typed above one that merely mentions it', () => {
    expect(searchCounties(locatedCounties, 'kisumu')[0]?.name).toBe('Kisumu')
  })

  it('returns everything for an empty query and nothing for a miss', () => {
    expect(searchCounties(locatedCounties, '   ')).toHaveLength(locatedCounties.length)
    expect(searchCounties(locatedCounties, 'reykjavik')).toHaveLength(0)
  })

  it('prints a number the way every other number on the site is printed', () => {
    expect(countyNumber(1)).toBe('01')
    expect(countyNumber(47)).toBe('47')
  })
})

describe('the map', () => {
  it('draws every county exactly once', () => {
    expect(countyShapes).toHaveLength(47)
    expect(new Set(countyShapes.map((shape) => shape.no)).size).toBe(47)
    expect(countyShapes.map((s) => s.no).sort((a, b) => a - b)).toEqual(
      counties.map((c) => c.no),
    )
  })

  it('gives every county a path that is actually drawable', () => {
    for (const shape of countyShapes) {
      expect(shape.d.startsWith('M')).toBe(true)
      expect(shape.d.length).toBeGreaterThan(40)
    }
  })

  it('lands every altar inside the country it is in', () => {
    for (const altar of allAltars) {
      const [latitude, longitude] = altar.at
      expect(latitude).toBeGreaterThan(mapBounds.south)
      expect(latitude).toBeLessThan(mapBounds.north)
      expect(longitude).toBeGreaterThan(mapBounds.west)
      expect(longitude).toBeLessThan(mapBounds.east)
    }
  })

  it('projects a pin the same way the outlines were projected', () => {
    /* Nairobi is south and east of Kakamega, so on the drawing it is
       below it and to the right of it. If the projection ever flips, this
       is where it shows. */
    const nairobi = projectPin(-1.2899457, 36.8360263)
    const kakamega = projectPin(0.2827, 34.7519)
    expect(nairobi.y).toBeGreaterThan(kakamega.y)
    expect(nairobi.x).toBeGreaterThan(kakamega.x)
  })
})

describe('what the search engines are told', () => {
  it('publishes each altar with the ministry’s own coordinates', () => {
    const county = locatedCounties[0]
    const altar = county.altars![0]
    const data = altarPlaceData(county, altar, 'https://maps.example/place')

    expect(data['@type']).toBe('Church')
    expect(data.name).toBe(altar.name)
    expect(data.geo).toEqual({
      '@type': 'GeoCoordinates',
      latitude: altar.at[0],
      longitude: altar.at[1],
    })
    expect(data.address.addressCountry).toBe('KE')
    expect(data.hasMap).toBe('https://maps.example/place')
  })

  it('leaves the telephone out rather than inventing one', () => {
    const withoutPhone = allAltars.find((altar) => !altar.phone)
    if (!withoutPhone) return
    const county = locatedCounties.find((c) => c.altars?.includes(withoutPhone))!
    expect(altarPlaceData(county, withoutPhone, '#')).not.toHaveProperty('telephone')
  })
})

describe('an altar at its own address', () => {
  it('gives every altar a page, and no two the same one', () => {
    expect(altarEntries).toHaveLength(allAltars.length)
    expect(new Set(altarEntries.map((entry) => entry.slug)).size).toBe(altarEntries.length)
  })

  it('names the page after the county a reader would type', () => {
    expect(altarBySlug('nakuru')?.county.name).toBe('Nakuru')
    expect(altarBySlug('kisii')?.county.name).toBe('Kisii')
    /* The county's formal name is Nairobi City; nobody searches for that. */
    expect(altarBySlug('nairobi')?.county.name).toBe('Nairobi City')
    expect(altarBySlug('nairobi-city')).toBeUndefined()
  })

  it('tells two altars in one county apart by their towns', () => {
    const laikipia = entriesIn(counties.find((county) => county.no === 31)!)
    expect(laikipia.map((entry) => entry.slug)).toEqual([
      'laikipia-nanyuki',
      'laikipia-nyahururu',
    ])
  })

  it('keeps slugs free of punctuation the URL cannot carry', () => {
    for (const entry of altarEntries) {
      expect(entry.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(altarPath(entry)).toBe(`/altars/${entry.slug}`)
    }
  })

  it('answers an unknown slug with nothing rather than with the first altar', () => {
    expect(altarBySlug('atlantis')).toBeUndefined()
    expect(altarBySlug('')).toBeUndefined()
  })
})

describe('how far apart two altars are', () => {
  it('measures a known distance', () => {
    /* Nairobi to Mombasa is about 440 km as the crow flies. */
    const nairobi = altarBySlug('nairobi')!
    const mombasa = altarBySlug('mombasa')!
    const km = distanceKm(nairobi.altar.at, mombasa.altar.at)
    expect(km).toBeGreaterThan(400)
    expect(km).toBeLessThan(480)
  })

  it('is zero from a place to itself, and symmetrical', () => {
    const a = altarEntries[0].altar.at
    const b = altarEntries[5].altar.at
    expect(distanceKm(a, a)).toBeCloseTo(0)
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 6)
  })

  it('offers the nearest altars, nearest first, and never itself', () => {
    const nakuru = altarBySlug('nakuru')!
    const near = nearestEntries(nakuru, 4)

    expect(near).toHaveLength(4)
    expect(near.map((n) => n.entry.slug)).not.toContain('nakuru')
    expect(near[0].entry.slug).toBe('laikipia-nyahururu')
    expect([...near].sort((a, b) => a.km - b.km)).toEqual(near)
  })

  it('leaves its own county to the rail that already lists it', () => {
    /* Laikipia holds both Nanyuki and Nyahururu; neither should turn up
       under the other's "nearest", where the county rail has it already. */
    const nyahururu = altarBySlug('laikipia-nyahururu')!
    const slugs = nearestEntries(nyahururu, 6).map((n) => n.entry.slug)
    expect(slugs).not.toContain('laikipia-nanyuki')
    expect(slugs).not.toContain('laikipia-nyahururu')
  })
})

describe('the county inset', () => {
  it('frames a county in the drawing it was projected onto', () => {
    const box = countyViewBox(32).split(' ').map(Number)
    expect(box).toHaveLength(4)
    /* Square, so a long thin county is never stretched to fill the frame. */
    expect(box[2]).toBeCloseTo(box[3], 5)
    expect(box[2]).toBeGreaterThan(0)
  })

  it('holds the altar it is drawn for inside the frame', () => {
    for (const { county, altar } of altarEntries) {
      const [x, y, side] = countyViewBox(county.no).split(' ').map(Number)
      const pin = projectPin(altar.at[0], altar.at[1])
      expect(pin.x).toBeGreaterThan(x)
      expect(pin.x).toBeLessThan(x + side)
      expect(pin.y).toBeGreaterThan(y)
      expect(pin.y).toBeLessThan(y + side)
    }
  })
})

describe('the altars, in the site’s own search', () => {
  it('finds an altar by the county a reader types', async () => {
    const index = await buildSearchIndex()
    const hits = searchDocs(index, 'nakuru').filter((doc) => doc.kind === 'Altar')

    expect(hits).toHaveLength(1)
    expect(hits[0].href).toBe('/altars/nakuru')
  })

  it('carries one row per altar, each pointing at its own page', async () => {
    const index = await buildSearchIndex()
    const altars = index.filter((doc) => doc.kind === 'Altar')

    expect(altars).toHaveLength(allAltars.length)
    expect(new Set(altars.map((doc) => doc.href)).size).toBe(altars.length)
    for (const doc of altars) expect(doc.href.startsWith('/altars/')).toBe(true)
  })

  it('leaves the rest of the index alone', async () => {
    const index = await buildSearchIndex()
    expect(index.filter((doc) => doc.kind === 'Teaching').length).toBeGreaterThan(0)
    expect(index.filter((doc) => doc.kind === 'Prophecy').length).toBeGreaterThan(0)
  })
})
