import { useEffect, useMemo, useState, useCallback } from 'react'
import Header from './components/Header'
import SearchFilterBar from './components/SearchFilterBar'
import LocationSearch from './components/LocationSearch'
import MapView from './components/MapView'
import EventList from './components/EventList'
import NearbyHelpList from './components/NearbyHelpList'
import EventDetailsModal from './components/EventDetailsModal'
import { fetchEarthquakes } from './api/usgs'
import { fetchNaturalEvents } from './api/eonet'
import { fetchFloods } from './api/flood'
import { fetchNearbyFacilities } from './api/places'
import { filterEvents } from './utils/normalizeEvents'

const AUTO_REFRESH_MS = 5 * 60 * 1000 // 5 minutes

export default function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [severity, setSeverity] = useState('All')
  const [range, setRange] = useState('week')

  const [selectedEvent, setSelectedEvent] = useState(null)

  // --- Nearby Help mode state (fully separate from disaster state above) ---
  const [mode, setMode] = useState('disasters') // 'disasters' | 'help'
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [facilities, setFacilities] = useState([])
  const [helpLoading, setHelpLoading] = useState(false)
  const [helpError, setHelpError] = useState(null)

  useEffect(() => {
    if (!selectedLocation) return

    let cancelled = false

    async function loadFacilities() {
      setHelpLoading(true)
      setHelpError(null)

      try {
        const results = await fetchNearbyFacilities(selectedLocation.lat, selectedLocation.lon)
        if (!cancelled) setFacilities(results)
      } catch (err) {
        // Overpass failing must never affect disaster monitoring — this state is isolated.
        if (!cancelled) setHelpError(err.message)
      } finally {
        if (!cancelled) setHelpLoading(false)
      }
    }

    loadFacilities()

    return () => {
      cancelled = true
    }
  }, [selectedLocation])

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Each source is fetched independently (allSettled, not all) so that one source
    // failing — e.g. the flood API being briefly unavailable — never blanks out the
    // others. We only show a blocking error if every single source failed.
    const [quakeResult, naturalResult, floodResult] = await Promise.allSettled([
      fetchEarthquakes(range),
      fetchNaturalEvents(),
      fetchFloods(),
    ])

    const quakes = quakeResult.status === 'fulfilled' ? quakeResult.value : []
    const natural = naturalResult.status === 'fulfilled' ? naturalResult.value : []
    const floods = floodResult.status === 'fulfilled' ? floodResult.value : []

    const combined = [...quakes, ...natural, ...floods].sort(
      (a, b) => b.time - a.time
    )

    setEvents(combined)
    setLastUpdated(new Date().toLocaleTimeString())

    const failures = [quakeResult, naturalResult, floodResult].filter(
      (r) => r.status === 'rejected'
    )

    if (failures.length === 3) {
      // Every source failed — this is the only case where we block the whole UI.
      setError(failures[0].reason?.message || 'Failed to load events')
    } else if (failures.length > 0) {
      // Partial failure: log it, but keep showing whatever data did load.
      console.warn(
        'Some event sources failed to load:',
        failures.map((f) => f.reason?.message)
      )
    }

    setLoading(false)
  }, [range])

  useEffect(() => {
    loadEvents()

    const interval = setInterval(loadEvents, AUTO_REFRESH_MS)

    return () => clearInterval(interval)
  }, [loadEvents])

  const types = useMemo(() => {
    const unique = new Set(events.map((e) => e.type))
    return ['All', ...Array.from(unique).sort()]
  }, [events])

  const filtered = useMemo(
    () => filterEvents(events, { query, type, severity }),
    [events, query, type, severity]
  )

  return (
    <div className="flex flex-col h-screen">
      <Header
        onRefresh={loadEvents}
        loading={loading}
        lastUpdated={lastUpdated}
        mode={mode}
        setMode={setMode}
      />

      {mode === 'disasters' ? (
        <SearchFilterBar
          query={query}
          setQuery={setQuery}
          type={type}
          setType={setType}
          severity={severity}
          setSeverity={setSeverity}
          types={types}
          range={range}
          setRange={setRange}
        />
      ) : (
        <LocationSearch onSelectLocation={setSelectedLocation} />
      )}

      <main className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* Map */}
        <div className="w-full md:w-2/3 h-[45vh] md:h-full shrink-0">
          <MapView
            events={filtered}
            onSelect={setSelectedEvent}
            mode={mode}
            selectedLocation={selectedLocation}
            facilities={facilities}
          />
        </div>

        {/* Side panel: disaster event list, or nearby-help list */}
        <aside className="w-full md:w-1/3 flex-1 min-h-0 border-t md:border-t-0 md:border-l border-slate-800">
          {mode === 'disasters' ? (
            <EventList
              events={filtered}
              onSelect={setSelectedEvent}
              loading={loading}
              error={error}
            />
          ) : (
            <NearbyHelpList
              selectedLocation={selectedLocation}
              facilities={facilities}
              loading={helpLoading}
              error={helpError}
            />
          )}
        </aside>
      </main>

      <EventDetailsModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  )
}