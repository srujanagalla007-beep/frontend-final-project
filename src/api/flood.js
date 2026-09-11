// GDACS (Global Disaster Alert and Coordination System) — public REST API, no key required.
// GDACS is a cooperation framework between the United Nations and the European Commission,
// providing near-real-time alerts for floods, cyclones, earthquakes, volcanoes, droughts,
// and wildfires. Docs: https://www.gdacs.org/Documents/2025/GDACS_API_quickstart_v2.pdf
//
// WHY GDACS AND NOT CWC:
// India's Central Water Commission flood portals (ffs.india-water.gov.in, aff.india-water.gov.in)
// are HTML dashboards only — they do not expose a public machine-readable API. Researchers who
// need CWC river-level data (e.g. the GUARDIAN dataset, Patidar et al. 2024) have had to scrape
// the website directly, which confirms there's no official endpoint to consume safely from a
// frontend app. GDACS, by contrast, publishes a documented public GeoJSON endpoint intended for
// exactly this kind of external consumption, with real alert levels (Green/Orange/Red) rather
// than invented severity values.
//
// NOTE: GDACS flood data is near-real-time aggregated hazard monitoring, not an official
// government emergency warning. SafeAlert labels it accordingly.

const GDACS_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH'

export async function fetchFloods() {
  // Flood "episodes" on GDACS can run for weeks and don't update every day, so we look back
  // 6 months to make sure there's realistically something to show during a demo.
  const toDate = new Date()
  const fromDate = new Date(toDate.getTime() - 180 * 24 * 60 * 60 * 1000)

  const params = new URLSearchParams({
    eventlist: 'FL',
    fromdate: fromDate.toISOString().slice(0, 10),
    todate: toDate.toISOString().slice(0, 10),
  })

  const res = await fetch(`${GDACS_URL}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`GDACS request failed: ${res.status}`)
  }

  const data = await res.json()

  return (data.features || [])
    // The API's eventlist filter isn't always reliable in practice, so filter defensively
    // to guarantee we never accidentally show a non-flood event as a flood.
    .filter((f) => f.properties?.eventtype === 'FL' && f.geometry?.coordinates)
    .map(mapFloodFeature)
}

function mapFloodFeature(feature) {
  const { properties, geometry } = feature
  const [lon, lat] = geometry.coordinates
  const alertLevel = properties.alertlevel || 'Green'

  return {
    id: `gdacs-fl-${properties.eventid}-${properties.episodeid}`,
    source: 'GDACS',
    type: 'Flood',
    title: properties.name || 'Flood',
    place: properties.country || 'Unknown location',
    time: new Date(properties.todate || properties.fromdate).getTime(),
    magnitude: null,
    severity: alertLevelToSeverity(alertLevel),
    // Kept alongside `severity` (not instead of it) so the details modal can show GDACS's
    // own Green/Orange/Red wording — a real distinction from the source, not an invented one.
    alertLevel,
    lat,
    lon,
    url: properties.url?.report || null,
  }
}

function alertLevelToSeverity(alertLevel) {
  switch (alertLevel) {
    case 'Red':
      return 'severe'
    case 'Orange':
      return 'major'
    default:
      return 'minor' // Green, or anything unexpected
  }
}
