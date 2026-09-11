export default function ModeToggle({ mode, setMode }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-800 rounded-lg">
      <button
        onClick={() => setMode('disasters')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          mode === 'disasters'
            ? 'bg-sky-600 text-white'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        Disasters
      </button>
      <button
        onClick={() => setMode('help')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          mode === 'help'
            ? 'bg-sky-600 text-white'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        Nearby Help
      </button>
    </div>
  )
}
