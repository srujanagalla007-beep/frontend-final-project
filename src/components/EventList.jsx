import EventCard from './EventCard'

export default function EventList({ events, onSelect, loading, error }) {
  if (loading) {
    return (
      <div className="p-4 text-sm text-slate-400">Loading events…</div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-400">
        Couldn't load events: {error}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-400">
        No events match your search/filters.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
      {events.map((e) => (
        <EventCard key={e.id} event={e} onSelect={onSelect} />
      ))}
    </div>
  )
}
