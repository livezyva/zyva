"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { formatEventTime, CATEGORY_META } from '../lib/format';
import { useLanguage } from './LanguageProvider';

export default function FeaturedCarousel({ events }) {
  const { language, t, categoryShort, cityName, priceLabel, eventDescription } = useLanguage();
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (!events?.length) return;
    timer.current = setInterval(() => setIdx(i => (i + 1) % events.length), 5500);
    return () => clearInterval(timer.current);
  }, [events]);

  if (!events?.length) return null;
  const e = events[idx];
  const { dayLabel, time } = formatEventTime(e.start_datetime, e.end_datetime, language);
  const cat = CATEGORY_META[e.category] || { emoji: '✨', short: e.category };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-zneon shadow-neon">
      <Link href={`/events/${e.slug}`} className="block relative aspect-[16/9] sm:aspect-[21/9]">
        <img src={e.cover_image_url} alt={e.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-zneon text-black text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">★ {t('event.recommended')}</span>
            <span className="bg-black/60 backdrop-blur border border-zborder text-white text-xs px-2.5 py-1 rounded-full">{cat.emoji} {categoryShort(e.category)}</span>
            <span className="text-white text-xs sm:text-sm font-semibold">{dayLabel} · {time} · {cityName(e.city)}</span>
          </div>
          <h2 className="font-headline text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            {e.title}
          </h2>
          <p className="text-ztext2 text-sm sm:text-base mt-2 max-w-2xl line-clamp-2">{eventDescription(e)}</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 bg-zneon text-black font-bold px-5 py-2.5 rounded-full shadow-neonSoft hover:shadow-neon transition">
              {t('event.details')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
            <span className="text-white/90 text-sm font-semibold">{priceLabel(e.price_label)}</span>
          </div>
        </div>
      </Link>
      <div className="absolute bottom-3 right-4 z-20 flex gap-1.5">
        {events.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`${language === 'el' ? 'Διαφάνεια' : 'Slide'} ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 bg-zneon' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
      </div>
    </div>
  );
}
