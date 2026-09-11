const SEVERITIES = ['All', 'minor', 'moderate', 'major', 'severe']

export default function SearchFilterBar({
  query,
  setQuery,
  type,
  setType,
  severity,
  setSeverity,
  types,
  range,
  setRange,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 p-3 bg-slate-900/60 border-b border-slate-800">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by place or event name…"
        className="flex-1 rounded-lg bg-slate-800 text-white placeholder-slate-500 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="rounded-lg bg-slate-800 text-white text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
      >
        {types.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        className="rounded-lg bg-slate-800 text-white text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
      >
        {SEVERITIES.map((s) => (
          <option key={s} value={s}>
            {s === 'All' ? 'All severities' : s}
          </option>
        ))}
      </select>

      <select
        value={range}
        onChange={(e) => setRange(e.target.value)}
        className="rounded-lg bg-slate-800 text-white text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
        title="Time window for earthquake data"
      >
        <option value="day">Past 24h</option>
        <option value="week">Past 7 days</option>
      </select>
    </div>
  )
}
