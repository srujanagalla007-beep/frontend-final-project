export default function NearbyHelpList({ selectedLocation, facilities, loading, error }) {
  if (!selectedLocation) {
    return (
      <div className="p-4 text-sm text-slate-400">
        Search for a location above to find nearby hospitals and shelters.
      </div>
    )
  }

  if (loading) {
    return <div className="p-4 text-sm text-slate-400">Finding nearby help…</div>
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-400">
        Couldn't load nearby facilities: {error}
      </div>
    )
  }

  if (facilities.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-400">
        No nearby facilities found for this location.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
      <p className="text-xs text-slate-500 px-1">
        Near <span className="text-slate-300">{selectedLocation.label}</span>
      </p>

      {facilities.map((f) => (
        <div key={f.id} className="p-3 rounded-lg bg-slate-800 border border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full text-slate-900"
              style={{
                backgroundColor: f.facilityType === 'hospital' ? '#38bdf8' : '#f59e0b',
              }}
            >
              {f.facilityType === 'hospital' ? '🏥 Hospital' : '⛺ Shelter'}
            </span>
            <span className="text-xs text-slate-400">{f.distanceKm.toFixed(1)} km</span>
          </div>

          <p className="text-sm font-medium text-white mt-2">{f.name}</p>
          {f.address && <p className="text-xs text-slate-400 mt-1">{f.address}</p>}
        </div>
      ))}
    </div>
  )
}
