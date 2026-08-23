"use client";

export default function ViewToggle({ view, setView }) {
  return (
    <div className="inline-flex bg-zcard border border-zborder rounded-full p-1">
      {[
        { id: 'list', label: 'List', icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="4" cy="18" r="1.5"/></svg>
        )},
        { id: 'map', label: 'Map', icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3l-6 3v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/></svg>
        )},
      ].map(o => (
        <button
          key={o.id}
          onClick={() => setView(o.id)}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition ${
            view === o.id ? 'bg-zneon text-black shadow-neonSoft' : 'text-ztext2 hover:text-white'
          }`}
        >
          {o.icon} {o.label}
        </button>
      ))}
    </div>
  );
}
