"use client";
import { useEffect, useRef, useState } from 'react';
import { CATEGORY_META } from '../lib/format';
import { useLanguage } from './LanguageProvider';

const TIMEFRAMES = [
  { id: 'all', key: 'filter.anyTime' },
  { id: 'tonight', key: 'filter.tonight' },
  { id: 'tomorrow', key: 'filter.tomorrow' },
  { id: 'weekend', key: 'filter.weekend' },
  { id: 'upcoming', key: 'filter.upcoming' },
];

const CITIES = ['All', 'Limassol', 'Nicosia', 'Paphos', 'Larnaca', 'Ayia Napa'];
const CATEGORIES = ['All', 'Clubs & Nightlife', 'Live Music', 'Bars', 'Restobar', 'Restaurants & Dining', 'Beach Bars', 'Festivals & Concerts', 'Cultural & Pop-ups'];

const DEFAULTS = { q: '', timeframe: 'all', city: 'All', category: 'All' };

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition ${
        active
          ? 'bg-zneon text-black border-zneon shadow-neonSoft'
          : 'bg-zcard text-ztext2 border-zborder hover:border-zneon hover:text-zneon'
      }`}
    >
      {children}
    </button>
  );
}

function ActiveTag({ label, onRemove }) {
  const { t } = useLanguage();
  return (
    <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-zneon/15 border border-zneon/50 text-zneon text-xs font-semibold">
      {label}
      <button
        onClick={onRemove}
        className="h-4 w-4 rounded-full bg-zneon/25 hover:bg-zneon hover:text-black flex items-center justify-center transition"
        aria-label={t('filter.remove', { label })}
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </span>
  );
}

export default function FilterBar({ filters, setFilters, view, setView, resultCount, loading }) {
  const { t, categoryShort, cityName } = useLanguage();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const update = (patch) => setFilters(f => ({ ...f, ...patch }));

  // Count how many non-default filters are active
  const activeCount =
    (filters.timeframe !== 'all' ? 1 : 0) +
    (filters.city !== 'All' ? 1 : 0) +
    (filters.category !== 'All' ? 1 : 0);

  const reset = () => setFilters({ ...DEFAULTS, q: filters.q });

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const timeframeKey = TIMEFRAMES.find(item => item.id === filters.timeframe)?.key;
  const timeframeLabel = timeframeKey ? t(timeframeKey) : '';

  return (
    <div ref={panelRef} className="sticky top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-black/85 backdrop-blur-lg border-b border-zborder">
      {/* Row 1: search + filters button + view toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ztext3 pointer-events-none">
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3-3" />
          </svg>
          <input
            type="text"
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder={t('filter.searchPlaceholder')}
            className="w-full bg-zcard border border-zborder rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-ztext3 focus:outline-none focus:border-zneon focus:shadow-neonSoft transition"
          />
          {filters.q && (
            <button
              onClick={() => update({ q: '' })}
              aria-label={t('filter.clearSearch')}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-ztext3 hover:text-white hover:bg-zborder flex items-center justify-center"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          )}
        </div>

        <button
          onClick={() => setOpen(o => !o)}
          className={`relative shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition ${
            open || activeCount > 0
              ? 'bg-zneon text-black border-zneon shadow-neonSoft'
              : 'bg-zcard text-white border-zborder hover:border-zneon hover:text-zneon'
          }`}
          aria-expanded={open}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 6h18M6 12h12M10 18h4"/>
          </svg>
          <span className="hidden sm:inline">{t('filter.filters')}</span>
          {activeCount > 0 && (
            <span className={`h-5 min-w-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
              open ? 'bg-black text-zneon' : 'bg-zneon text-black'
            }`}>
              {activeCount}
            </span>
          )}
        </button>

        {/* View toggle inline */}
        <div className="hidden sm:inline-flex bg-zcard border border-zborder rounded-full p-0.5 shrink-0">
          {['list', 'map'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-label={v === 'list' ? t('filter.listView') : t('filter.mapView')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition capitalize ${
                view === v ? 'bg-zneon text-black shadow-neonSoft' : 'text-ztext2 hover:text-white'
              }`}
            >
              {v === 'list' ? (
                <span className="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="4" cy="18" r="1.5"/></svg>{t('filter.list')}</span>
              ) : (
                <span className="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3l-6 3v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/></svg>{t('filter.map')}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: active filter chips + result count */}
      {(activeCount > 0 || (!loading && resultCount != null)) && (
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          {filters.timeframe !== 'all' && (
            <ActiveTag label={timeframeLabel} onRemove={() => update({ timeframe: 'all' })} />
          )}
          {filters.city !== 'All' && (
            <ActiveTag label={`📍 ${cityName(filters.city)}`} onRemove={() => update({ city: 'All' })} />
          )}
          {filters.category !== 'All' && (
            <ActiveTag
              label={`${CATEGORY_META[filters.category]?.emoji || ''} ${categoryShort(filters.category)}`}
              onRemove={() => update({ category: 'All' })}
            />
          )}
          {activeCount > 0 && (
            <button onClick={reset} className="text-ztext3 hover:text-white text-xs font-semibold underline underline-offset-2">
              {t('filter.clearAll')}
            </button>
          )}
          <span className="ml-auto text-ztext3 text-xs">
            {loading ? t('common.loading') : t('filter.resultCount', { count: resultCount, label: resultCount === 1 ? t('common.event') : t('common.events') })}
          </span>
        </div>
      )}

      {/* Mobile view toggle */}
      <div className="sm:hidden mt-2.5 flex justify-center">
        <div className="inline-flex bg-zcard border border-zborder rounded-full p-0.5">
          {['list', 'map'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition capitalize ${
                view === v ? 'bg-zneon text-black' : 'text-ztext2'
              }`}
            >
              {v === 'list' ? t('filter.list') : t('filter.map')}
            </button>
          ))}
        </div>
      </div>

      {/* Slide-down panel */}
      {open && (
        <div className="mt-3 pt-4 border-t border-zborder space-y-4 animate-[fadeIn_.15s_ease]">
          <FilterSection label={t('filter.when')}>
            {TIMEFRAMES.map(item => (
              <Chip key={item.id} active={filters.timeframe === item.id} onClick={() => update({ timeframe: item.id })}>
                {t(item.key)}
              </Chip>
            ))}
          </FilterSection>
          <FilterSection label={t('filter.city')}>
            {CITIES.map(c => (
              <Chip key={c} active={filters.city === c} onClick={() => update({ city: c })}>
                {c === 'All' ? t('filter.allCities') : cityName(c)}
              </Chip>
            ))}
          </FilterSection>
          <FilterSection label={t('filter.category')}>
            {CATEGORIES.map(c => {
              const m = CATEGORY_META[c];
              return (
                <Chip key={c} active={filters.category === c} onClick={() => update({ category: c })}>
                  {m ? `${m.emoji} ${categoryShort(c)}` : t('filter.allCategories')}
                </Chip>
              );
            })}
          </FilterSection>
          <div className="flex items-center justify-between pt-2">
            <button onClick={reset} className="text-ztext2 hover:text-white text-sm font-semibold">
              {t('filter.reset')}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="bg-zneon text-black font-bold px-6 py-2 rounded-full text-sm shadow-neonSoft hover:shadow-neon transition"
            >
              {t('filter.showResults', { count: resultCount ?? '' })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({ label, children }) {
  return (
    <div>
      <div className="text-ztext3 text-[11px] uppercase tracking-wider mb-2 px-1 font-semibold">{label}</div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{children}</div>
    </div>
  );
}
