import { describe, expect, it } from 'vitest'
import { counties } from '@/lib/content'
import {
  allAltars,
  altarPlaceData,
  awaitingCounties,
  countyNumber,
  locatedCounties,
  searchCounties,
} from '@/lib/altars'
import { countyShapes, mapBounds, projectPin } from '@/lib/county-map'

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
