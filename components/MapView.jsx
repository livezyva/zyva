"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gmapsDirectionsUrl } from '../lib/maps';
import { formatEventTime, CATEGORY_META } from '../lib/format';
import { useLanguage } from './LanguageProvider';

function MapLoading() {
  const { t } = useLanguage();
  return <div className="h-full w-full grid place-items-center bg-[#0b0b0f] text-ztext3">{t('discover.loadingMap')}</div>;
}

// Leaflet needs `window`, so load only on the client
const EventMap = dynamic(() => import('./EventMap'), {
  ssr: false,
  loading: () => <MapLoading />,
});

export default function MapView({ events }) {
  const { language, t, cityName, priceLabel } = useLanguage();
  const router = useRouter();
  const points = useMemo(() => events.filter(e => e.latitude && e.longitude), [events]);
  const [selected, setSelected] = useState(points[0] || null);
  const listRef = useRef(null);

  const openEvent = (e) => {
    if (!e) return;
    router.push(`/events/${e.slug}`);
  };

  useEffect(() => {
    if (points.length === 0) { setSelected(null); return; }
    if (!selected || !points.find(p => p.id === selected.id)) setSelected(points[0]);
  }, [points]); // eslint-disable-line

  useEffect(() => {
    if (!selected || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-eid="${selected.id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selected]);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zborder py-20 text-center text-ztext2">
        {t('map.noLocations')}
      </div>
    );
  }

  const query = selected ? `${selected.venue_name}, ${selected.address}` : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Real Google Maps with green dot overlay */}
      <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-zborder bg-[#0b0b0f]" style={{ height: '72vh', minHeight: 480 }}>
        <EventMap
          events={points}
          selectedId={selected?.id}
          onSelect={setSelected}
          onOpen={openEvent}
        />

        {/* Floating event card — click anywhere (except the Directions link) to open details */}
        {selected && (
          <Link
            href={`/events/${selected.slug}`}
            prefetch
            className="group absolute left-3 right-3 bottom-3 sm:right-auto sm:max-w-sm z-30 bg-black/90 backdrop-blur-lg border border-zneon rounded-2xl shadow-neon p-3 flex gap-3 hover:shadow-[0_0_28px_rgba(29,185,84,0.55)] hover:border-zneon hover:-translate-y-0.5 transition"
            aria-label={t('event.open', { title: selected.title })}
          >
            <img
              src={selected.cover_image_url}
              alt=""
              className="w-20 h-20 object-cover rounded-xl shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-zneon font-bold uppercase tracking-widest">
                {CATEGORY_META[selected.category]?.emoji} {formatEventTime(selected.start_datetime, selected.end_datetime, language).dayLabel} · {formatEventTime(selected.start_datetime, selected.end_datetime, language).time}
              </div>
              <div className="font-headline font-bold text-sm leading-tight mt-0.5 line-clamp-2 group-hover:text-zneon transition">
                {selected.title}
              </div>
              <div className="text-ztext2 text-xs mt-0.5 truncate">
                {selected.venue_name} · {cityName(selected.city)}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 bg-zneon text-black font-bold text-xs px-3 py-1.5 rounded-full">
                  {t('map.viewDetails')}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </span>
                <a
                  href={gmapsDirectionsUrl({ lat: selected.latitude, lng: selected.longitude, query })}
                  target="_blank" rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="border border-zborder text-white font-semibold text-xs px-3 py-1.5 rounded-full hover:border-zneon hover:text-zneon transition"
                >
                  {t('map.directions')}
                </a>
                <span className="text-zneon font-semibold text-xs ml-auto">{priceLabel(selected.price_label)}</span>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Venue list */}
      <div className="lg:col-span-2 bg-zcard border border-zborder rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '72vh' }}>
        <div className="px-4 py-3 border-b border-zborder">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-headline font-bold">{t('map.venues')}</div>
              <div className="text-ztext3 text-xs">{t('filter.resultCount', { count: points.length, label: points.length === 1 ? t('common.location') : t('common.locations') })}</div>
            </div>
            <span className="whitespace-pre-line text-ztext3 text-[10px] uppercase tracking-wider hidden sm:inline">{t('map.tapHelp')}</span>
          </div>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-zborder">
          {points.map(e => {
            const isSel = selected?.id === e.id;
            const eventTime = formatEventTime(e.start_datetime, e.end_datetime, language);
            return (
              <div
                key={e.id}
                data-eid={e.id}
                className={`group flex items-stretch transition ${
                  isSel ? 'bg-zneon/10 border-l-2 border-l-zneon' : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                }`}
              >
                {/* Click the row (excluding open button) → preview on map */}
                <button
                  onClick={() => {
                    if (isSel) openEvent(e);   // second click on same row = open
                    else setSelected(e);        // first click = preview
                  }}
                  className="flex-1 min-w-0 text-left px-4 py-3 flex gap-3"
                >
                  <div className="shrink-0 mt-1">
                    <div className={`h-4 w-4 rounded-full border-2 border-black ${isSel ? 'bg-zneon shadow-[0_0_10px_rgba(29,185,84,0.9)]' : 'bg-white/60'}`} />
                  </div>
                  <img src={e.cover_image_url} alt="" className="w-14 h-14 object-cover rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm leading-tight line-clamp-2 ${isSel ? 'text-zneon' : 'text-white'}`}>
                      {e.title}
                    </div>
                    <div className="text-ztext2 text-xs mt-0.5 truncate">{e.venue_name} · {cityName(e.city)}</div>
                    <div className="text-ztext3 text-[11px] mt-0.5">
                      {eventTime.dayLabel} · {eventTime.time} · <span className="text-zneon font-semibold">{priceLabel(e.price_label)}</span>
                    </div>
                  </div>
                </button>
                {/* Open-details arrow */}
                <Link
                  href={`/events/${e.slug}`}
                  prefetch
                  onMouseEnter={() => router.prefetch(`/events/${e.slug}`)}
                  aria-label={t('event.open', { title: e.title })}
                  className="shrink-0 pr-3 pl-2 flex items-center text-ztext3 hover:text-zneon transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6l6 6-6 6"/></svg>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
