"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSavedIds } from '../../lib/saved';
import EventCard from '../../components/EventCard';
import { useLanguage } from '../../components/LanguageProvider';

export default function SavedClient() {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    const ids = new Set(getSavedIds());
    if (ids.size === 0) { setEvents([]); setLoading(false); return; }
    setLoading(true);
    fetch('/api/events?timeframe=all')
      .then(r => r.json())
      .then(d => setEvents((d.events || []).filter(e => ids.has(e.id))))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    window.addEventListener('zyva:saved-changed', load);
    return () => window.removeEventListener('zyva:saved-changed', load);
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="text-ztext3 text-sm uppercase tracking-wider">{t('saved.yourList')}</div>
        <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight mt-1">{t('saved.title')}</h1>
      </div>
      {loading ? (
        <div className="text-ztext2">{t('common.loading')}</div>
      ) : events.length === 0 ? (
        <div className="border border-dashed border-zborder rounded-2xl py-20 text-center">
          <div className="text-4xl mb-3">🔖</div>
          <div className="font-headline font-bold text-xl">{t('saved.emptyTitle')}</div>
          <div className="text-ztext2 text-sm mt-1 mb-5">{t('saved.emptyBody')}</div>
          <Link href="/" className="inline-flex items-center gap-2 bg-zneon text-black font-bold px-5 py-2.5 rounded-full">
            {t('saved.discover')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </main>
  );
}
