"use client";
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { formatEventTime, relativeCountdown, CATEGORY_META } from '../../../lib/format';
import { isSaved, toggleSaved } from '../../../lib/saved';
import { instagramUrl, telHref, gmapsDirectionsUrl } from '../../../lib/maps';
import EventCard from '../../../components/EventCard';
import { useLanguage } from '../../../components/LanguageProvider';

function MapLoading() {
  const { t } = useLanguage();
  return <div className="h-64 rounded-2xl border border-zborder bg-zcard grid place-items-center text-ztext3">{t('discover.loadingMap')}</div>;
}

const MiniMap = dynamic(() => import('../../../components/MiniMap'), { ssr: false, loading: () => <MapLoading /> });

export default function EventDetailClient({ event, venue, related }) {
  const { language, locale, t, categoryName, cityName, priceLabel, eventDescription } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setSaved(isSaved(event.id));
    const r = () => setSaved(isSaved(event.id));
    window.addEventListener('zyva:saved-changed', r);
    return () => window.removeEventListener('zyva:saved-changed', r);
  }, [event.id]);

  const eventTime = formatEventTime(event.start_datetime, event.end_datetime, language);
  const cat = CATEGORY_META[event.category] || { emoji: '✨', short: event.category };
  const startFull = new Date(event.start_datetime).toLocaleString(locale, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const endFull = new Date(event.end_datetime).toLocaleString(locale, { hour: '2-digit', minute: '2-digit' });

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const data = { title: event.title, text: `${event.title} — ${eventTime.dayLabel} ${t('event.at')} ${event.venue_name}`, url };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
      fetch(`/api/events/${event.slug}/share`, { method: 'POST' });
    } catch {}
  };

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden min-h-[420px] sm:min-h-[520px]">
        <div className="absolute inset-0">
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16">
          <Link href="/" className="inline-flex items-center gap-2 text-ztext2 hover:text-zneon text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
            {t('event.backDiscovery')}
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {event.is_featured ? (
              <span className="bg-zneon text-black text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">★ {t('event.recommended')}</span>
            ) : null}
            <span className="bg-black/60 backdrop-blur border border-zborder text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {cat.emoji} {categoryName(event.category)}
            </span>
            <span className="bg-black/60 backdrop-blur border border-zborder text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              📍 {cityName(event.city)}
            </span>
            <span className="bg-zneon/90 text-black text-xs font-bold px-2.5 py-1 rounded-full">
              {relativeCountdown(event.start_datetime, language)}
            </span>
          </div>
          <h1 className="font-headline text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mt-4 max-w-4xl">
            {event.title}
          </h1>
          <p className="text-ztext2 mt-3 text-lg">
            {t('event.at')} <Link href="#venue" className="text-white hover:text-zneon font-semibold">{event.venue_name}</Link>
          </p>
        </div>
      </section>

      {/* CTA BAR */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-zcard border border-zborder rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 -mt-8 shadow-xl shadow-black/50">
          <div className="flex-1">
            <div className="text-ztext3 text-xs uppercase tracking-wider">{t('event.when')}</div>
            <div className="font-headline font-bold text-lg">{startFull} <span className="text-ztext3 font-normal">→ {endFull}</span></div>
          </div>
          <div className="hidden sm:block h-10 w-px bg-zborder" />
          <div>
            <div className="text-ztext3 text-xs uppercase tracking-wider">{t('event.entry')}</div>
            <div className="font-headline font-bold text-lg text-zneon">{priceLabel(event.price_label)}</div>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <button
              onClick={() => toggleSaved(event.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-full font-semibold border transition ${
                saved ? 'bg-zneon text-black border-zneon shadow-neonSoft' : 'bg-zcard text-white border-zborder hover:border-zneon hover:text-zneon'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />
              </svg>
              {saved ? t('event.going') : t('event.imGoing')}
            </button>
            <button
              onClick={share}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-full font-semibold border border-zborder text-white hover:border-zneon hover:text-zneon transition"
              aria-label={t('event.shareAria')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>
              </svg>
              {copied ? t('event.linkCopied') : t('event.share')}
            </button>
            <BuyCta event={event} venue={venue} />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="font-headline text-2xl font-bold mb-3">{t('event.about')}</h2>
            <p className="text-ztext2 leading-relaxed whitespace-pre-line">{eventDescription(event)}</p>
          </section>

          <section id="venue" className="space-y-4">
            <h2 className="font-headline text-2xl font-bold">{t('event.venue')}</h2>
            <div className="bg-zcard border border-zborder rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-headline font-bold text-xl flex items-center gap-2">
                    {event.venue_name}
                    {venue?.is_verified ? (
                      <span title={t('event.verified')} className="text-zneon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 2.6 3.5-.3.7 3.5 3 2-1.6 3.2 1.6 3.2-3 2-.7 3.5-3.5-.3L12 22l-2.4-2.6-3.5.3-.7-3.5-3-2 1.6-3.2L2.4 7.8l3-2 .7-3.5 3.5.3L12 2z"/></svg>
                      </span>
                    ) : null}
                  </div>
                  <div className="text-ztext2 text-sm mt-1 flex items-start gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-1 shrink-0">
                      <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    <span>{event.address}</span>
                  </div>
                </div>
              </div>

              {/* Social & contact links */}
              <VenueLinks venue={venue} />

              {event.latitude && event.longitude && (
                <div className="mt-4">
                  <MiniMap
                    lat={event.latitude}
                    lng={event.longitude}
                    venueName={event.venue_name}
                    address={event.address}
                  />
                </div>
              )}
            </div>
          </section>

          {related.length > 0 && (
            <section>
              <h2 className="font-headline text-2xl font-bold mb-4">{t('event.moreAt', { venue: event.venue_name })}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {related.map(r => <EventCard key={r.id} event={r} />)}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-zcard border border-zborder rounded-2xl p-5">
            <div className="text-ztext3 text-xs uppercase tracking-wider">{t('event.category')}</div>
            <div className="font-headline font-bold text-lg mt-1">{cat.emoji} {categoryName(event.category)}</div>
          </div>
          <div className="bg-zcard border border-zborder rounded-2xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ztext2">{t('event.views')}</span>
              <span className="font-semibold">{event.views_count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ztext2">{t('event.shares')}</span>
              <span className="font-semibold">{event.shares_count.toLocaleString()}</span>
            </div>
            <div className="h-px bg-zborder my-2" />
            <div className="text-ztext3 text-xs">
              {t('event.listingRuns', { count: event.listing_duration_days, label: event.listing_duration_days === 1 ? t('common.day') : t('common.days') })}
            </div>
          </div>
          <div className="bg-gradient-to-br from-zneon/20 to-transparent border border-zneon/40 rounded-2xl p-5">
            <div className="font-headline font-bold">{t('event.organizerQuestion')}</div>
            <p className="text-ztext2 text-sm mt-1 mb-3">{t('event.organizerPitch')}</p>
            <Link href="/apply" className="inline-flex items-center gap-2 bg-zneon text-black font-bold px-4 py-2 rounded-full text-sm hover:shadow-neonSoft">
              {t('event.listEvent')}
            </Link>
          </div>
        </aside>
      </main>
    </>
  );
}

/* ─────────────────────── Smart primary CTA ─────────────────────── */
function BuyCta({ event, venue }) {
  const { t } = useLanguage();
  // Priority: explicit ticket URL → phone → website → nothing
  let href, label, external = true;
  if (event.ticket_url && event.ticket_url !== 'https://example.com/tickets') {
    href = event.ticket_url; label = t('event.buyTickets');
  } else if (venue?.phone) {
    href = telHref(venue.phone); label = t('event.callReserve'); external = false;
  } else if (venue?.website_url) {
    href = venue.website_url; label = t('event.visitWebsite');
  } else if (venue?.instagram_handle) {
    href = instagramUrl(venue.instagram_handle); label = t('event.messageInstagram');
  } else {
    return null;
  }
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel="noreferrer"
      className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold bg-zneon text-black shadow-neonSoft hover:shadow-neon transition"
    >
      {label}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </a>
  );
}

/* ─────────────────────── Venue social & contact links ─────────────────────── */
function VenueLinks({ venue }) {
  const { t } = useLanguage();
  if (!venue) return null;
  const ig = instagramUrl(venue.instagram_handle);
  const fb = venue.facebook_url;
  const web = venue.website_url;
  const tel = telHref(venue.phone);
  if (!ig && !fb && !web && !tel) return null;

  const items = [
    ig && { href: ig, label: venue.instagram_handle, kind: 'ig', title: 'Instagram' },
    fb && { href: fb, label: 'Facebook', kind: 'fb', title: 'Facebook' },
    web && { href: web, label: prettyDomain(web), kind: 'web', title: t('common.website') },
    tel && { href: tel, label: venue.phone, kind: 'tel', title: t('common.call') },
  ].filter(Boolean);

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((it, i) => (
        <a
          key={i}
          href={it.href}
          target={it.kind === 'tel' ? undefined : '_blank'}
          rel="noreferrer"
          title={it.title}
          className="group inline-flex items-center gap-2 px-3 py-2 rounded-full bg-black border border-zborder text-white text-sm font-semibold hover:border-zneon hover:text-zneon hover:shadow-neonSoft transition"
        >
          <SocialIcon kind={it.kind} />
          <span className="truncate max-w-[180px]">{it.label}</span>
        </a>
      ))}
    </div>
  );
}

function prettyDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function SocialIcon({ kind }) {
  const p = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'ig') return (
    <svg {...p}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
  );
  if (kind === 'fb') return (
    <svg {...p} fill="currentColor" stroke="none"><path d="M13 22V12h3l1-4h-4V5.5c0-1 .3-1.5 1.7-1.5H17V.2C16.6.1 15.4 0 14 0c-3 0-5 1.8-5 5.2V8H6v4h3v10h4z"/></svg>
  );
  if (kind === 'web') return (
    <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>
  );
  if (kind === 'tel') return (
    <svg {...p}><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012 4.2 2 2 0 014 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L7.9 9.8a16 16 0 006 6l1.4-1.4a2 2 0 012.1-.4c.8.3 1.7.5 2.6.6A2 2 0 0122 16.9z"/></svg>
  );
  return null;
}
