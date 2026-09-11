// USGS Earthquake API — public, no API key required.
// India + nearby region

const BASE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query'

export async function fetchEarthquakes(range = 'week') {
  const days = range === 'day' ? 1 : 7

  const endTime = new Date()
  const startTime = new Date(
    endTime.getTime() - days * 24 * 60 * 60 * 1000
  )

  const params = new URLSearchParams({
    format: 'geojson',
    starttime: startTime.toISOString(),
    endtime: endTime.toISOString(),

    // India + nearby earthquake-prone region
    minlatitude: '6',
    maxlatitude: '37',
    minlongitude: '68',
    maxlongitude: '98',

    // Sort newest first
    orderby: 'time-asc',
    limit: '500',
  })

  const url = `${BASE_URL}?${params.toString()}`

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`USGS request failed: ${res.status}`)
  }

  const data = await res.json()

  return data.features
    .filter((feature) => feature.geometry?.coordinates)
    .map(mapEarthquakeFeature)
}

function mapEarthquakeFeature(feature) {
  const { id, properties, geometry } = feature
  const [lon, lat] = geometry.coordinates
  const mag = properties.mag ?? 0

  return {
    id: `usgs-${id}`,
    source: 'USGS',
    type: 'Earthquake',
    title: properties.title,
    place: properties.place,
    time: properties.time,
    magnitude: mag,
    severity: magnitudeToSeverity(mag),
    lat,
    lon,
    url: properties.url,
  }
}

function magnitudeToSeverity(mag) {
  if (mag >= 6) return 'severe'
  if (mag >= 4.5) return 'major'
  if (mag >= 3) return 'moderate'
  return 'minor'
}