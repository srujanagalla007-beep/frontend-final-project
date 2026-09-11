// NASA EONET (Earth Observatory Natural Event Tracker) — public, no API key required.
// Docs: https://eonet.gsfc.nasa.gov/docs/v3

const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100'

export async function fetchNaturalEvents() {
  const res = await fetch(EONET_URL)
  if (!res.ok) {
    throw new Error(`EONET request failed: ${res.status}`)
  }
  const data = await res.json()
  return data.events.flatMap(mapEonetEvent).filter(Boolean)
}

function mapEonetEvent(event) {
  // Some events have multiple geometries (e.g. storm tracks) — use the latest point.
  const geometries = event.geometry || []
  const latest = geometries[geometries.length - 1]
  if (!latest || !latest.coordinates) return []

  // EONET points are [lon, lat]; some (like storms) are nested polygons — skip those.
  const coords = latest.coordinates
  if (typeof coords[0] !== 'number' || typeof coords[1] !== 'number') return []
  const [lon, lat] = coords

  const category = event.categories?.[0]?.title || 'Natural Event'

  return [{
    id: `eonet-${event.id}`,
    source: 'EONET',
    type: category,
    title: event.title,
    place: category,
    time: new Date(latest.date).getTime(),
    magnitude: null,
    severity: categoryToSeverity(category),
    lat,
    lon,
    url: event.sources?.[0]?.url || null,
  }]
}

function categoryToSeverity(category) {
  const high = ['Wildfires', 'Severe Storms', 'Volcanoes']
  const medium = ['Floods', 'Sea and Lake Ice', 'Drought']
  if (high.includes(category)) return 'major'
  if (medium.includes(category)) return 'moderate'
  return 'minor'
}
