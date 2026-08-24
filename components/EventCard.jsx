"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatEventTime, CATEGORY_META } from '../lib/format';
import { isSaved, toggleSaved } from '../lib/saved';
import { instagramUrl } from '../lib/maps';
import { useLanguage } from './LanguageProvider';

export default function EventCard({ event, featured = false }) {
  const { language, t, categoryShort, cityName, priceLabel } = useLanguage();
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setSaved(isSaved(event.id));
    const refresh = () => setSaved(isSaved(event.id));
    window.addEventListener('zyva:saved-changed', refresh);
    return () => window.removeEventListener('zyva:saved-changed', refresh);
  }, [event.id]);

  const { dayLabel, time } = formatEventTime(event.start_datetime, event.end_datetime, language);
  const cat = CATEGORY_META[event.category] || { emoji: '✨', short: event.category };
  const isFeatured = featured || event.is_featured;

  const onSave = (e) => {
    e.preventDefault(); e.stopPropagation();
    toggleSaved(event.id);
  };

  return (
    <Link
      href={`/events/${event.slug}`}
      className={`card-glow group block bg-zcard border rounded-2xl overflow-hidden relative ${
        isFeatured ? 'border-zneon shadow-neonSoft' : 'border-zborder'
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={event.cover_image_url}
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        {isFeatured && (
          <span className="absolute top-3 left-3 bg-zneon text-black text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-neonSoft">
            ★ {t('event.recommended')}
          </span>
        )}
        <button
          onClick={onSave}
          aria-label={saved ? t('event.removeSaved') : t('event.save')}
          className={`absolute top-3 right-3 h-9 w-9 rounded-full border flex items-center justify-center backdrop-blur-md transition ${
            saved
              ? 'bg-zneon text-black border-zneon shadow-neonSoft'
              : 'bg-black/50 text-white border-zborder hover:border-zneon hover:text-zneon'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />
          </svg>
        </button>
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
          <span className="bg-black/70 backdrop-blur border border-zborder text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {cat.emoji} {categoryShort(event.category)}
          </span>
          <span className="bg-zneon/90 text-black text-xs font-bold px-2.5 py-1 rounded-full">
            {dayLabel} · {time}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-headline font-bold text-lg leading-tight line-clamp-2 group-hover:text-zneon transition">
          {event.title}
        </h3>
        <p className="text-ztext2 text-sm mt-1 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="truncate">{event.venue_name}</span>
          <span className="text-ztext3">·</span>
          <span className="text-ztext3">{cityName(event.city)}</span>
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-zneon font-semibold text-sm">{priceLabel(event.price_label)}</span>
          <div className="flex items-center gap-1">
            <VenueMiniLinks event={event} />
            <span className="text-ztext3 text-xs flex items-center gap-1 ml-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {event.views_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function VenueMiniLinks({ event }) {
  const { t } = useLanguage();
  const stop = (e) => { e.stopPropagation(); };
  const ig = instagramUrl(event.venue_instagram);
  const fb = event.venue_facebook;
  const web = event.venue_website;
  if (!ig && !fb && !web) return null;
  return (
    <div className="flex items-center gap-0.5">
      {ig && (
        <a href={ig} target="_blank" rel="noreferrer" onClick={stop}
          title={`${event.venue_instagram} on Instagram`}
          className="h-6 w-6 rounded-full flex items-center justify-center text-ztext3 hover:text-zneon hover:bg-zneon/10 transition">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
        </a>
      )}
      {fb && (
        <a href={fb} target="_blank" rel="noreferrer" onClick={stop}
          title="Facebook"
          className="h-6 w-6 rounded-full flex items-center justify-center text-ztext3 hover:text-zneon hover:bg-zneon/10 transition">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 22V12h3l1-4h-4V5.5c0-1 .3-1.5 1.7-1.5H17V.2C16.6.1 15.4 0 14 0c-3 0-5 1.8-5 5.2V8H6v4h3v10h4z"/></svg>
        </a>
      )}
      {web && (
        <a href={web} target="_blank" rel="noreferrer" onClick={stop}
          title={t('common.website')}
          className="h-6 w-6 rounded-full flex items-center justify-center text-ztext3 hover:text-zneon hover:bg-zneon/10 transition">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>
        </a>
      )}
    </div>
  );
}
