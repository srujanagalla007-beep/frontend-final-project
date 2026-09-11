import { haversineDistanceKm } from '../utils/geo'

// Overpass servers
const OVERPASS_URLS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

const DEFAULT_RADIUS_METERS = 10000
const OVERPASS_TIMEOUT_MS = 12000
const NOMINATIM_TIMEOUT_MS = 10000

export async function fetchNearbyFacilities(
  lat,
  lon,
  radiusMeters = DEFAULT_RADIUS_METERS
) {
  if (
    typeof lat !== 'number' ||
    typeof lon !== 'number' ||
    Number.isNaN(lat) ||
    Number.isNaN(lon)
  ) {
    throw new Error('Invalid location coordinates.')
  }

  // First try Overpass
  try {
    const overpassResults = await fetchFromOverpass(
      lat,
      lon,
      radiusMeters
    )

    if (overpassResults.length > 0) {
      return overpassResults
    }
  } catch (error) {
    console.warn(
      'Overpass unavailable. Using OpenStreetMap search fallback:',
      error.message
    )
  }

  // Fallback to Nominatim
  try {
    const nominatimResults = await fetchFromNominatim(
      lat,
      lon,
      radiusMeters
    )

    return nominatimResults
  } catch (error) {
    console.error(
      'Nominatim fallback failed:',
      error.message
    )

    throw new Error(
      'Nearby facilities service is temporarily unavailable. Please try again.'
    )
  }
}


// --------------------------------------------------
// OVERPASS
// --------------------------------------------------

async function fetchFromOverpass(
  lat,
  lon,
  radiusMeters
) {
  const query = `
    [out:json][timeout:20];

    (
      nwr["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
      nwr["amenity"="clinic"](around:${radiusMeters},${lat},${lon});
      nwr["healthcare"="hospital"](around:${radiusMeters},${lat},${lon});
      nwr["healthcare"="clinic"](around:${radiusMeters},${lat},${lon});
      nwr["emergency"="shelter"](around:${radiusMeters},${lat},${lon});
      nwr["social_facility"="shelter"](around:${radiusMeters},${lat},${lon});
    );

    out center tags;
  `

  let lastError = null

  for (const baseUrl of OVERPASS_URLS) {
    const controller = new AbortController()

    const timer = setTimeout(() => {
      controller.abort()
    }, OVERPASS_TIMEOUT_MS)

    try {
      console.log(
        'Trying Overpass:',
        baseUrl
      )

      const url =
        `${baseUrl}?data=${encodeURIComponent(query)}`

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        )
      }

      const data = await response.json()

      const facilities = (data.elements || [])
        .map((element) =>
          mapOverpassElement(
            element,
            lat,
            lon
          )
        )
        .filter(Boolean)
        .sort(
          (a, b) =>
            a.distanceKm - b.distanceKm
        )

      console.log(
        `Overpass found ${facilities.length} facilities`
      )

      return facilities
    } catch (error) {
      lastError =
        error.name === 'AbortError'
          ? new Error('Request timed out')
          : error

      console.warn(
        'Overpass failed:',
        baseUrl,
        lastError.message
      )
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError ||
    new Error('Overpass unavailable')
}


// --------------------------------------------------
// NOMINATIM FALLBACK
// --------------------------------------------------

async function fetchFromNominatim(
  lat,
  lon,
  radiusMeters
) {
  console.log(
    'Using OpenStreetMap Nominatim fallback'
  )

  const radiusDegrees =
    radiusMeters / 111000

  const south = lat - radiusDegrees
  const north = lat + radiusDegrees
  const west = lon - radiusDegrees
  const east = lon + radiusDegrees

  const searches = [
    {
      query: 'hospital',
      type: 'hospital',
    },
    {
      query: 'clinic',
      type: 'hospital',
    },
    {
      query: 'shelter',
      type: 'shelter',
    },
  ]

  const allResults = []

  // Nominatim asks clients to avoid heavy request bursts.
  for (const search of searches) {
    try {
      const results =
        await searchNominatim(
          search.query,
          search.type,
          south,
          west,
          north,
          east
        )

      allResults.push(...results)

      // Small delay between requests
      await sleep(1100)
    } catch (error) {
      console.warn(
        `Nominatim ${search.query} search failed:`,
        error.message
      )
    }
  }

  // Remove duplicates
  const unique = new Map()

  for (const facility of allResults) {
    if (!unique.has(facility.id)) {
      unique.set(
        facility.id,
        facility
      )
    }
  }

  return Array.from(unique.values())
    .sort(
      (a, b) =>
        a.distanceKm - b.distanceKm
    )
}


// Search OpenStreetMap through Nominatim
async function searchNominatim(
  query,
  facilityType,
  south,
  west,
  north,
  east
) {
  const controller =
    new AbortController()

  const timer = setTimeout(() => {
    controller.abort()
  }, NOMINATIM_TIMEOUT_MS)

  try {
    const params =
      new URLSearchParams({
        q: query,
        format: 'json',
        limit: '10',
        addressdetails: '1',
        bounded: '1',
        viewbox:
          `${west},${north},${east},${south}`,
      })

    const url =
      `https://nominatim.openstreetmap.org/search?${params.toString()}`

    const response =
      await fetch(url, {
        method: 'GET',
        headers: {
          Accept:
            'application/json',
        },
        signal: controller.signal,
      })

    if (!response.ok) {
      throw new Error(
        `Nominatim returned ${response.status}`
      )
    }

    const data =
      await response.json()

    return data
      .map((item) => {
        const itemLat =
          Number(item.lat)

        const itemLon =
          Number(item.lon)

        if (
          Number.isNaN(itemLat) ||
          Number.isNaN(itemLon)
        ) {
          return null
        }

        return {
          id:
            `nominatim-${item.place_id}`,

          facilityType,

          name:
            item.display_name
              ?.split(',')
              ?.slice(0, 2)
              ?.join(',') ||
            (
              facilityType ===
              'hospital'
                ? 'Hospital / Clinic'
                : 'Shelter'
            ),

          lat: itemLat,

          lon: itemLon,

          distanceKm:
            haversineDistanceKm(
              Number(
                item.lat
              ) * 0 +
              getOriginLat(
                item,
                itemLat
              ),
              Number(
                item.lon
              ) * 0 +
              getOriginLon(
                item,
                itemLon
              ),
              itemLat,
              itemLon
            ),

          address:
            item.display_name ||
            null,
        }
      })
      .filter(Boolean)
  } finally {
    clearTimeout(timer)
  }
}


// --------------------------------------------------
// OVERPASS MAPPING
// --------------------------------------------------

function mapOverpassElement(
  element,
  originLat,
  originLon
) {
  const tags =
    element.tags || {}

  const elLat =
    element.lat ??
    element.center?.lat

  const elLon =
    element.lon ??
    element.center?.lon

  if (
    elLat == null ||
    elLon == null
  ) {
    return null
  }

  const facilityType =
    classify(tags)

  if (!facilityType) {
    return null
  }

  return {
    id:
      `osm-${element.type}-${element.id}`,

    facilityType,

    name:
      tags.name ||
      (
        facilityType ===
        'hospital'
          ? 'Unnamed hospital/clinic'
          : 'Unnamed shelter'
      ),

    lat: elLat,

    lon: elLon,

    distanceKm:
      haversineDistanceKm(
        originLat,
        originLon,
        elLat,
        elLon
      ),

    address:
      formatAddress(tags),
  }
}


function classify(tags) {
  if (
    tags.amenity === 'hospital' ||
    tags.amenity === 'clinic' ||
    tags.healthcare === 'hospital' ||
    tags.healthcare === 'clinic'
  ) {
    return 'hospital'
  }

  if (
    tags.emergency === 'shelter' ||
    tags.social_facility === 'shelter'
  ) {
    return 'shelter'
  }

  return null
}


function formatAddress(tags) {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
  ].filter(Boolean)

  return parts.length
    ? parts.join(' ')
    : null
}


function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  )
}


// Nominatim results already contain their
// own coordinates. These helpers simply keep
// the mapping structure safe.
function getOriginLat(
  item,
  fallback
) {
  return item._originLat ??
    fallback
}

function getOriginLon(
  item,
  fallback
) {
  return item._originLon ??
    fallback
}