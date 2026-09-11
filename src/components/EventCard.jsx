import { SEVERITY_COLORS, formatTime, timeAgo } from '../utils/normalizeEvents'

export default function EventCard({ event, onSelect }) {
  return (
    <button
      onClick={() => onSelect(event)}
      className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-750 hover:border-sky-500/60 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:ring-offset-1 focus:ring-offset-slate-900 transition-all duration-200 border border-slate-700 hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full text-slate-900"
          style={{ backgroundColor: SEVERITY_COLORS[event.severity] }}
        >
          {event.severity}
        </span>

        <span className="text-xs text-slate-500">
          {event.source}
        </span>
      </div>

      <p className="text-sm font-medium text-white mt-2 line-clamp-2">
        {event.title}
      </p>

      <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
        <span>{formatTime(event.time)}</span>
        <span>{timeAgo(event.time)}</span>
      </div>
    </button>
  )
}