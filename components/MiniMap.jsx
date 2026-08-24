"use client";
import { gmapsEmbedSrc, gmapsDirectionsUrl, gmapsPlaceUrl } from '../lib/maps';
import { useLanguage } from './LanguageProvider';

export default function MiniMap({ lat, lng, venueName, address }) {
  const { t } = useLanguage();
  const query = venueName && address ? `${venueName}, ${address}` : null;
  const src = gmapsEmbedSrc({ lat, lng, query, zoom: 15 });
  const dirUrl = gmapsDirectionsUrl({ lat, lng, query });
  const placeUrl = gmapsPlaceUrl({ lat, lng, query });

  return (
    <div className="rounded-2xl overflow-hidden border border-zborder bg-zcard">
      <iframe
        src={src}
        width="100%"
        height="260"
        style={{
          border: 0,
          display: 'block',
          filter: 'invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9) saturate(0.85)',
          backgroundColor: '#0b0b0f',
        }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        title={t('map.mapOf', { venue: venueName || t('event.venue') })}
      />
      <div className="flex gap-2 p-3 border-t border-zborder bg-zcard">
        <a
          href={dirUrl}
          target="_blank" rel="noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-zneon text-black font-bold text-sm px-4 py-2.5 rounded-full shadow-neonSoft hover:shadow-neon transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" transform="rotate(45 12 12)"/>
          </svg>
          {t('map.getDirections')}
        </a>
        <a
          href={placeUrl}
          target="_blank" rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 border border-zborder text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:border-zneon hover:text-zneon transition"
        >
          {t('map.openMaps')}
        </a>
      </div>
    </div>
  );
}
