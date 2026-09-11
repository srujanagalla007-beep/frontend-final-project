import { SEVERITY_COLORS, formatTime, timeAgo } from '../utils/normalizeEvents'

export default function EventDetailsModal({ event, onClose }) {
  if (!event) return null

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full text-slate-900"
            style={{ backgroundColor: SEVERITY_COLORS[event.severity] }}
          >
            {event.severity.toUpperCase()}
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <h2 className="text-white text-lg font-bold mt-3">{event.title}</h2>

        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Type" value={event.type} />
          <Row label="Location" value={event.place || '—'} />
          {event.magnitude != null && (
            <Row label="Magnitude" value={event.magnitude.toFixed(1)} />
          )}
          {event.alertLevel && (
            <Row label="Alert Level" value={`${event.alertLevel} (GDACS)`} />
          )}
          <Row label="Time" value={`${formatTime(event.time)} (${timeAgo(event.time)})`} />
          <Row label="Coordinates" value={`${event.lat.toFixed(2)}, ${event.lon.toFixed(2)}`} />
          <Row label="Source" value={event.source} />
        </dl>

        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sky-400 hover:text-sky-300 text-sm underline"
          >
            View official source →
          </a>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-white font-medium text-right">{value}</dd>
    </div>
  )
}
