"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import EventForm from '../../components/admin/EventForm';
import { getCurrentAuth, getAuthToken } from '../../lib/supabase';
import { useLanguage } from '../../components/LanguageProvider';

export default function OrganizerPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [state, setState] = useState({ loading: true, auth: null });
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const auth = await getCurrentAuth();
    if (!auth.user) { router.replace('/auth?next=/organizer'); return; }
    if (auth.role !== 'ORGANIZER' && !auth.isAdmin) {
      router.replace('/apply'); return;
    }
    setState({ loading: false, auth });

    const token = await getAuthToken();
    const [evRes, veRes] = await Promise.all([
      fetch('/api/organizer/events', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/organizer/venues', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
    ]);
    const ev = await evRes.json();
    setEvents(ev.events || []);
    if (veRes) {
      const ve = await veRes.json().catch(() => ({ venues: [] }));
      setVenues(ve.venues || []);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onSaved = async () => { setShowForm(false); await load(); };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-zbg text-white">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-ztext3">{t('common.loading')}</div>
      </div>
    );
  }

  const pending = events.filter(e => e.status === 'PENDING_APPROVAL');
  const live = events.filter(e => e.status === 'APPROVED_ACTIVE' && new Date(e.end_datetime) >= new Date());
  const rejected = events.filter(e => e.status === 'REJECTED');
  const past = events.filter(e => new Date(e.end_datetime) < new Date());

  return (
    <div className="min-h-screen bg-zbg text-white">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-ztext3 text-xs uppercase tracking-wider">{t('organizer.dashboard')}</div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold mt-1">{t('organizer.yourEvents')}</h1>
            <p className="text-ztext2 mt-1 text-sm">{t('organizer.intro')}</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-zneon text-black font-bold px-5 py-3 rounded-full shadow-neonSoft hover:shadow-neon transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
            {t('organizer.submitNew')}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label={t('organizer.liveNow')} value={live.length} accent />
          <Stat label={t('organizer.pendingReview')} value={pending.length} warn={pending.length > 0} />
          <Stat label={t('organizer.rejected')} value={rejected.length} />
          <Stat label={t('organizer.past')} value={past.length} />
        </div>

        <Section title={`${t('organizer.pendingReview')} (${pending.length})`} empty={t('organizer.noPending')}>
          {pending.map(e => <EventRow key={e.id} ev={e} />)}
        </Section>
        <Section title={`${t('organizer.liveNow')} (${live.length})`} empty={t('organizer.noLive')}>
          {live.map(e => <EventRow key={e.id} ev={e} />)}
        </Section>
        {rejected.length > 0 && (
          <Section title={`${t('organizer.rejected')} (${rejected.length})`}>
            {rejected.map(e => <EventRow key={e.id} ev={e} showReason />)}
          </Section>
        )}
        {past.length > 0 && (
          <Section title={`${t('organizer.pastEvents')} (${past.length})`}>
            {past.map(e => <EventRow key={e.id} ev={e} />)}
          </Section>
        )}
      </main>

      {showForm && (
        <EventForm
          initial={null}
          venues={venues}
          onClose={() => setShowForm(false)}
          onSaved={onSaved}
          asOrganizer={true}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent, warn }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'bg-zneon/10 border-zneon/40' : warn ? 'bg-yellow-500/10 border-yellow-500/40' : 'bg-zcard border-zborder'}`}>
      <div className="text-ztext3 text-xs uppercase tracking-wider">{label}</div>
      <div className={`font-headline text-3xl font-bold mt-1 ${accent ? 'text-zneon' : warn ? 'text-yellow-400' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function Section({ title, empty, children }) {
  const { t } = useLanguage();
  const arr = Array.isArray(children) ? children : (children ? [children] : []);
  return (
    <div className="mb-8">
      <div className="font-headline font-bold text-xl mb-3">{title}</div>
      {arr.length === 0 ? (
        <div className="text-ztext3 text-sm border border-dashed border-zborder rounded-2xl p-8 text-center">
          {empty || t('organizer.nothing')}
        </div>
      ) : (
        <div className="space-y-2">{arr}</div>
      )}
    </div>
  );
}

function EventRow({ ev, showReason }) {
  const { t, locale, cityName } = useLanguage();
  const start = new Date(ev.start_datetime);
  const when = start.toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const statusPill = {
    'PENDING_APPROVAL': { label: t('organizer.statusPending'), cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
    'APPROVED_ACTIVE': { label: t('organizer.statusLive'), cls: 'bg-zneon/20 text-zneon border-zneon/40' },
    'REJECTED':        { label: t('organizer.statusRejected'), cls: 'bg-red-500/20 text-red-300 border-red-500/40' },
    'EXPIRED':         { label: t('organizer.statusPast'), cls: 'bg-white/10 text-ztext2 border-white/20' },
  }[ev.status] || { label: ev.status, cls: 'bg-white/10 text-ztext2' };

  return (
    <div className="bg-zcard border border-zborder rounded-xl p-3 flex items-start gap-3">
      <img src={ev.cover_image_url} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusPill.cls}`}>
            {statusPill.label}
          </span>
          {ev.is_featured ? <span className="text-zneon text-xs font-bold">{t('organizer.recommended')}</span> : null}
        </div>
        <div className="font-semibold mt-1 truncate">{ev.title}</div>
        <div className="text-ztext3 text-xs mt-0.5">{when} · {ev.venue_name} · {cityName(ev.city)}</div>
        {showReason && ev.rejection_reason && (
          <div className="mt-1.5 text-red-300 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1">
            <strong>{t('organizer.rejectionReason')}</strong> {ev.rejection_reason}
          </div>
        )}
      </div>
    </div>
  );
}
