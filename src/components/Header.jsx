import ModeToggle from './ModeToggle'

export default function Header({ onRefresh, loading, lastUpdated, mode, setMode }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-5 py-3 sm:py-4 bg-slate-950 border-b border-slate-800 shadow-sm">
      {/* Logo and title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 shrink-0">
          <span className="text-xl sm:text-2xl">🌎</span>
        </div>

        <div className="min-w-0">
          <h1 className="text-lg font-bold text-white leading-tight">
            SafeAlert
          </h1>

          <p
            className="text-[10px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate"
            title="SafeAlert aggregates publicly available disaster and natural-event data from trusted sources."
          >
            Real-Time Disaster & Natural Event Monitoring
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
        <ModeToggle mode={mode} setMode={setMode} />

        {mode === 'disasters' && (
          <>
            {lastUpdated && (
              <span className="hidden sm:inline text-xs text-slate-500">
                Updated {lastUpdated}
              </span>
            )}

            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-2 transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/10 whitespace-nowrap"
            >
              <span className={loading ? 'animate-spin' : ''}>⟳</span>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </>
        )}
      </div>
    </header>
  )
}