"use client";
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from './Header';
import FilterBar from './FilterBar';
import FeaturedCarousel from './FeaturedCarousel';
import EventCard from './EventCard';
import { useLanguage } from './LanguageProvider';

function MapLoading() {
  const { t } = useLanguage();
  return <div className="h-[70vh] rounded-2xl border border-zborder bg-zcard grid place-items-center text-ztext3">{t('discover.loadingMap')}</div>;
}

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <MapLoading /> });

function useDebounced(value, delay = 250) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

export default function DiscoverPage() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState({ q: '', timeframe: 'all', city: 'All', category: 'All' });
  const [events, setEvents] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [totalCount, setTotalCount] = useState(0);
  const q = useDebounced(filters.q, 250);

  useEffect(() => {
    fetch('/api/events?featured=1')
      .then(r => r.json())
      .then(d => setFeatured(d.events || []))
      .catch(() => {});
    fetch('/api/meta').then(r => r.json()).then(d => setTotalCount(d.counts?.total || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (filters.timeframe !== 'all') p.set('timeframe', filters.timeframe);
    if (filters.city !== 'All') p.set('city', filters.city);
    if (filters.category !== 'All') p.set('category', filters.category);
    setLoading(true);
    fetch(`/api/events?${p.toString()}&include_venue=1`)
      .then(r => r.json())
      .then(d => setEvents(d.events || []))
      .finally(() => setLoading(false));
  }, [q, filters.timeframe, filters.city, filters.category]);

  const grouped = useMemo(() => {
    const g = { Tonight: [], Tomorrow: [], 'This Weekend': [], Upcoming: [] };
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const day = now.getDay();
    const daysToFri = (5 - day + 7) % 7;
    const fri = new Date(now); fri.setDate(now.getDate() + daysToFri); fri.setHours(0,0,0,0);
    const sun = new Date(fri); sun.setDate(fri.getDate() + 2); sun.setHours(23,59,59,999);

    for (const e of events) {
      const s = new Date(e.start_datetime);
      const en = new Date(e.end_datetime);
      const isTonight = s.toDateString() === now.toDateString() || (s < now && en > now);
      const isTom = s.toDateString() === tomorrow.toDateString();
      const isWk = s >= fri && s <= sun && !isTonight && !isTom;
      if (isTonight) g.Tonight.push(e);
      else if (isTom) g.Tomorrow.push(e);
      else if (isWk) g['This Weekend'].push(e);
      else g.Upcoming.push(e);
    }
    return g;
  }, [events]);

  return (
    <div className="min-h-screen bg-zbg">
      <Header />

      {/* Hero */}
      <section className="relative border-b border-zborder overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-0 bg-radial-fade" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="inline-flex items-center gap-2 bg-zcard border border-zborder rounded-full px-3 py-1 text-xs text-ztext2 mb-4">
            <span className="h-2 w-2 rounded-full bg-zneon animate-pulseNeon" />
            {totalCount ? t('discover.liveCount', { count: totalCount }) : t('discover.liveTonight')}
          </div>
          <h1 className="font-headline text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-none">
            {t('discover.heroBefore')} <span className="text-zneon">{t('discover.heroCyprus')}</span>,
            <br className="hidden sm:block" /> {t('discover.heroAfter')}
          </h1>
          <p className="text-ztext2 mt-4 max-w-2xl text-base sm:text-lg">
            {t('discover.heroBody')}
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Featured */}
        {featured.length > 0 && (
          <section className="mb-6">
            <FeaturedCarousel events={featured} />
          </section>
        )}

        {/* Sticky filter toolbar */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          view={view}
          setView={setView}
          resultCount={events.length}
          loading={loading}
        />

        {/* Content */}
        <section className="mt-6">
          {view === 'map' ? (
            events.length > 0 ? <MapView events={events} /> : <EmptyState />
          ) : (
            <ListView loading={loading} events={events} grouped={grouped} />
          )}
        </section>

        <footer className="pt-16 pb-10 text-center text-ztext3 text-xs border-t border-zborder mt-16">
          <div className="font-headline text-zneon font-bold tracking-wider mb-2">ZYVA</div>
          <div>{t('discover.footer', { year: new Date().getFullYear() })}</div>
        </footer>
      </main>
    </div>
  );
}

function EmptyState() {
  const { t } = useLanguage();
  return (
    <div className="border border-dashed border-zborder rounded-2xl py-20 text-center">
      <div className="text-4xl mb-3">🌒</div>
      <div className="font-headline font-bold text-xl">{t('discover.emptyTitle')}</div>
      <div className="text-ztext2 text-sm mt-1">{t('discover.emptyBody')}</div>
    </div>
  );
}

function ListView({ loading, events, grouped }) {
  const { t } = useLanguage();
  const groupLabels = {
    Tonight: t('group.tonight'),
    Tomorrow: t('group.tomorrow'),
    'This Weekend': t('group.weekend'),
    Upcoming: t('group.upcoming'),
  };
  if (loading && events.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-zcard border border-zborder rounded-2xl overflow-hidden">
            <div className="aspect-[16/10] bg-white/5" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (events.length === 0) return <EmptyState />;

  return (
    <div className="space-y-10">
      {Object.entries(grouped).map(([label, list]) => list.length > 0 && (
        <div key={label}>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-headline font-bold text-2xl sm:text-3xl">
              {groupLabels[label] || label} <span className="text-ztext3 text-base font-medium">({list.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
