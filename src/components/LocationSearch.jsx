import { useEffect, useState } from 'react'
import { geocodeSearch, reverseGeocode } from '../api/geocode'

export default function LocationSearch({ onSelectLocation }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [locating, setLocating] = useState(false)

  function isValidLocation(value) {
    const trimmed = value.trim()

    if (trimmed.length < 2) return false

    if (!/[a-zA-Z]/.test(trimmed)) return false

    if (/^(?=.*\d)(?=.*[a-zA-Z])[a-zA-Z0-9]+$/.test(trimmed)) {
      const letters = (trimmed.match(/[a-zA-Z]/g) || []).length
      const numbers = (trimmed.match(/\d/g) || []).length

      if (numbers > letters) return false
    }

    return true
  }

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < 2) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    if (!isValidLocation(trimmed)) {
      setResults([])
      setLoading(false)
      setError('Enter a valid location.')
      return
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)

        const locations = await geocodeSearch(trimmed)

        if (!locations || locations.length === 0) {
          setResults([])
          setError('Enter a valid location.')
          return
        }

        setResults(locations)
      } catch (err) {
        console.error('Location search error:', err)
        setResults([])
        setError(
          'Location search is temporarily unavailable. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query])

  function handleSubmit(e) {
    e.preventDefault()

    const trimmed = query.trim()

    if (!trimmed) {
      setResults([])
      setError('Enter a city or location.')
      return
    }

    if (!isValidLocation(trimmed)) {
      setResults([])
      setError('Enter a valid location.')
      return
    }

    if (results.length > 0) {
      pickLocation(results[0])
    } else if (!loading) {
      setError('Enter a valid location.')
    }
  }

  function pickLocation(location) {
    onSelectLocation(location)
    setQuery(location.label)
    setResults([])
    setError(null)
  }

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location detection.')
      return
    }

    // Browsers only allow geolocation on secure (HTTPS) origins, or on localhost
    // during local development. On plain HTTP, getCurrentPosition fails immediately.
    const isSecure =
      window.location.protocol === 'https:' ||
      ['localhost', '127.0.0.1'].includes(window.location.hostname)

    if (!isSecure) {
      setError(
        'Location access requires a secure (HTTPS) connection. Please open this site over HTTPS to use "Near me".'
      )
      return
    }

    setLocating(true)
    setError(null)
    setResults([])

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          const label = await reverseGeocode(latitude, longitude)
          pickLocation({ label, lat: latitude, lon: longitude })
        } catch (err) {
          console.error('Reverse geocoding error:', err)
          // Reverse geocoding is just for a nice label — still use the coordinates
          // we already have so the feature keeps working even if it fails.
          pickLocation({ label: 'My location', lat: latitude, lon: longitude })
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)

        // Note: browsers require HTTPS (or localhost) for geolocation to work at all.
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            'Location access was denied. Please allow location access for this site in your browser settings and try again.'
          )
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Your location could not be determined. Please try again or search manually.')
        } else if (err.code === err.TIMEOUT) {
          setError('Getting your location took too long. Please try again.')
        } else {
          setError('Could not get your location. Please try again or search manually.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }

  return (
    <div className="p-3 bg-slate-900/60 border-b border-slate-800">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a city or area, e.g. Vijayawada..."
          className="flex-1 rounded-lg bg-slate-800 text-white placeholder-slate-500 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          title="Use my current location"
          className="rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          <span className="hidden sm:inline">{locating ? 'Locating…' : 'Near me'}</span>
        </button>
      </form>

      {results.length > 0 && (
        <ul className="mt-2 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shadow-lg max-h-72 overflow-y-auto">
          {results.map((location, index) => (
            <li key={`${location.lat}-${location.lon}-${index}`}>
              <button
                type="button"
                onClick={() => pickLocation(location)}
                className="w-full text-left px-3 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
              >
                {location.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-xs text-red-400 mt-2">
          {error}
        </p>
      )}

      <p className="text-[10px] text-slate-600 mt-2">
        Search cities, towns, localities and areas · Facilities from OpenStreetMap
      </p>
    </div>
  )
}