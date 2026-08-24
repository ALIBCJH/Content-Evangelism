/**
 * Builds `src/lib/county-map.ts` — the outline of Kenya's forty-seven
 * counties, as SVG paths, from the boundaries geoBoundaries publishes.
 *
 * The map on /altars is drawn from these paths rather than from a tile
 * server, which is a deliberate choice: a tile server means every reader
 * who opens the page announces themselves to somebody else's host, and
 * the map itself stops working the day that host does. Kenya's borders
 * do not move often enough to be worth either risk. Re-run this script
 * when they do:
 *
 *     node scripts/build-county-map.mjs
 *
 * Source: geoBoundaries gbOpen KEN ADM1 (RCMRD GeoPortal), Public Domain.
 * The rings are simplified with Douglas–Peucker at a tolerance tuned to
 * the size the map is actually drawn at — a border accurate to a metre is
 * bytes a reader pays for and cannot see.
 */
import { writeFileSync } from 'node:fs'

const SOURCE =
  'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/KEN/ADM1/geoBoundaries-KEN-ADM1_simplified.geojson'

/** The drawing is 1000 units wide; everything below is in those units. */
const WIDTH = 1000
/** Ring detail below this is invisible at the size the map is shown. */
const TOLERANCE = 1.1
/** An island smaller than this is a speck of noise, not a place. */
const MIN_RING_AREA = 1.5

/* ── The counties, as this site numbers them ─────────────────────── */

/** Their own names differ from ours in punctuation and in two spellings. */
const key = (name) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')

const NUMBERS = {
  mombasa: 1, kwale: 2, kilifi: 3, tanariver: 4, lamu: 5, taitataveta: 6,
  garissa: 7, wajir: 8, mandera: 9, marsabit: 10, isiolo: 11, meru: 12,
  tharaka: 13, embu: 14, kitui: 15, machakos: 16, makueni: 17, nyandarua: 18,
  nyeri: 19, kirinyaga: 20, muranga: 21, kiambu: 22, turkana: 23,
  westpokot: 24, samburu: 25, transnzoia: 26, uasingishu: 27,
  elgeyomarakwet: 28, nandi: 29, baringo: 30, laikipia: 31, nakuru: 32,
  narok: 33, kajiado: 34, kericho: 35, bomet: 36, kakamega: 37, vihiga: 38,
  bungoma: 39, busia: 40, siaya: 41, kisumu: 42, homabay: 43, migori: 44,
  kisii: 45, nyamira: 46, nairobi: 47,
}

/* ── Geometry ────────────────────────────────────────────────────── */

/** Perpendicular distance from a point to the line through a and b. */
const distanceToLine = ([px, py], [ax, ay], [bx, by]) => {
  const dx = bx - ax
  const dy = by - ay
  const span = dx * dx + dy * dy
  if (span === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / span))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** Douglas–Peucker: keep the points that carry the shape, drop the rest. */
const simplify = (points, tolerance) => {
  if (points.length < 3) return points
  let worst = 0
  let at = 0
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = distanceToLine(points[i], points[0], points[points.length - 1])
    if (d > worst) {
      worst = d
      at = i
    }
  }
  if (worst <= tolerance) return [points[0], points[points.length - 1]]
  return [
    ...simplify(points.slice(0, at + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(at), tolerance),
  ]
}

/** Shoelace, unsigned — used only to tell an island from a stray vertex. */
const areaOf = (ring) => {
  let sum = 0
  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % ring.length]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}

/* ── Build ───────────────────────────────────────────────────────── */

const response = await fetch(SOURCE)
if (!response.ok) throw new Error(`geoBoundaries answered ${response.status}`)
const geo = await response.json()

/* Every ring in the file, so the projection can be fitted to the country
   rather than to a bounding box typed in from memory. */
const ringsOf = (geometry) =>
  geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()

let west = Infinity
let east = -Infinity
let south = Infinity
let north = -Infinity
for (const feature of geo.features) {
  for (const ring of ringsOf(feature.geometry)) {
    for (const [lon, lat] of ring) {
      if (lon < west) west = lon
      if (lon > east) east = lon
      if (lat < south) south = lat
      if (lat > north) north = lat
    }
  }
}

/* Equirectangular, with the longitudes squeezed by the cosine of the
   middle latitude. Kenya sits on the equator and is barely nine degrees
   tall, so the error this leaves is smaller than the stroke width. */
const squeeze = Math.cos((((north + south) / 2) * Math.PI) / 180)
const scale = WIDTH / ((east - west) * squeeze)
const height = Math.round((north - south) * scale * 100) / 100
const project = ([lon, lat]) => [
  (lon - west) * squeeze * scale,
  (north - lat) * scale,
]

const round = (n) => Math.round(n * 10) / 10

const pathFor = (geometry) =>
  ringsOf(geometry)
    .map((ring) => ring.map(project))
    .filter((ring) => areaOf(ring) >= MIN_RING_AREA)
    .map((ring) => simplify(ring, TOLERANCE))
    .map(
      (ring) =>
        `M${ring.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`,
    )
    .join('')

const counties = geo.features
  .map((feature) => {
    const no = NUMBERS[key(feature.properties.shapeName)]
    if (!no) throw new Error(`Unplaced county: ${feature.properties.shapeName}`)
    return { no, d: pathFor(feature.geometry) }
  })
  .sort((a, b) => a.no - b.no)

if (counties.length !== 47) throw new Error(`Got ${counties.length} counties, want 47`)

const file = `/**
 * Kenya's counties as SVG paths, and the projection that placed them.
 *
 * Generated by \`scripts/build-county-map.mjs\` — do not edit by hand.
 * Boundaries: geoBoundaries gbOpen KEN ADM1 (RCMRD GeoPortal), Public
 * Domain. Simplified for the size the map is drawn at.
 */

/** The drawing's own coordinate space. */
export const mapBox = { width: ${WIDTH}, height: ${height} }

/** The corner of the world the drawing covers, in degrees. */
export const mapBounds = {
  west: ${west},
  east: ${east},
  south: ${south},
  north: ${north},
  squeeze: ${squeeze},
}

/**
 * An altar's coordinates, placed on the same drawing its county is on.
 * The projection is the one above, so a pin cannot drift off its county.
 */
export function projectPin(latitude: number, longitude: number) {
  const scale = mapBox.width / ((mapBounds.east - mapBounds.west) * mapBounds.squeeze)
  return {
    x: (longitude - mapBounds.west) * mapBounds.squeeze * scale,
    y: (mapBounds.north - latitude) * scale,
  }
}

/** One outline per county, keyed by the number the Constitution gives it. */
export const countyShapes: { no: number; d: string }[] = [
${counties.map(({ no, d }) => `  { no: ${no}, d: '${d}' },`).join('\n')}
]
`

writeFileSync(new URL('../src/lib/county-map.ts', import.meta.url), file)
console.log(`Wrote src/lib/county-map.ts — ${(file.length / 1024).toFixed(1)}kB`)
