export const SEVERITY_ORDER = ['minor', 'moderate', 'major', 'severe']

export const SEVERITY_COLORS = {
  minor: '#22c55e',
  moderate: '#eab308',
  major: '#f97316',
  severe: '#ef4444',
}

export function formatTime(epochMs) {
  if (!epochMs) return 'Unknown time'
  const d = new Date(epochMs)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(epochMs) {
  if (!epochMs) return ''
  const diffMs = Date.now() - epochMs
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Applies search text + type + severity filters to the combined event list.
export function filterEvents(events, { query, type, severity }) {
  return events.filter((e) => {
    const matchesQuery =
      !query ||
      e.title?.toLowerCase().includes(query.toLowerCase()) ||
      e.place?.toLowerCase().includes(query.toLowerCase())

    const matchesType = type === 'All' || e.type === type

    const matchesSeverity = severity === 'All' || e.severity === severity

    return matchesQuery && matchesType && matchesSeverity
  })
}
