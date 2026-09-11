const PHOTON_URL = 'https://photon.komoot.io/api/'
const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse'

let controller = null

export async function geocodeSearch(query) {
  const trimmed = query.trim()

  if (!trimmed || trimmed.length < 2) {
    return []
  }

  // Cancel the previous request if the user is typing again
  if (controller) {
    controller.abort()
  }

  controller = new AbortController()

  const params = new URLSearchParams({
    q: trimmed,
    limit: '8',
    lang: 'en',
  })

  try {
    const res = await fetch(`${PHOTON_URL}?${params.toString()}`, {
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`Location search failed: ${res.status}`)
    }

    const data = await res.json()

    return (data.features || [])
      .map((feature) => {
        const coordinates = feature.geometry?.coordinates
        const properties = feature.properties || {}

        if (!coordinates || coordinates.length < 2) {
          return null
        }

        const [lon, lat] = coordinates

        const parts = [
          properties.name,
          properties.locality,
          properties.district,
          properties.city,
          properties.state,
          properties.country,
        ].filter(Boolean)

        // Remove duplicate consecutive/repeated names
        const uniqueParts = [...new Set(parts)]

        return {
          label: uniqueParts.join(', '),
          lat: Number(lat),
          lon: Number(lon),
        }
      })
      .filter(
        (location) =>
          location &&
          Number.isFinite(location.lat) &&
          Number.isFinite(location.lon)
      )
  } catch (error) {
    if (error.name === 'AbortError') {
      return []
    }

    throw error
  }
}

// Reverse geocode: turn coordinates (e.g. from the browser's geolocation API)
// into a human-readable label, using the same Photon service.
export async function reverseGeocode(lat, lon) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    limit: '1',
    lang: 'en',
  })

  const res = await fetch(`${PHOTON_REVERSE_URL}?${params.toString()}`)

  if (!res.ok) {
    throw new Error(`Reverse geocoding failed: ${res.status}`)
  }

  const data = await res.json()
  const feature = (data.features || [])[0]
  const properties = feature?.properties || {}

  const parts = [
    properties.name,
    properties.locality,
    properties.district,
    properties.city,
    properties.state,
    properties.country,
  ].filter(Boolean)

  const uniqueParts = [...new Set(parts)]

  return uniqueParts.length ? uniqueParts.join(', ') : 'My location'
}