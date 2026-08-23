"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import EventForm from '../../components/admin/EventForm';
import { getCurrentAuth, getAuthToken } from '../../lib/supabase';

export default function OrganizerPage() {
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
      fetch('/api/admin/venues', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
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
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-ztext3">Loading…</div>
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
            <div className="text-ztext3 text-xs uppercase tracking-wider">Organizer dashboard</div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold mt-1">Your events</h1>
            <p className="text-ztext2 mt-1 text-sm">
              Submit new events. All submissions go through admin review before going live. Currently <span className="text-zneon font-semibold">free during launch</span>.
            </p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-zneon text-black font-bold px-5 py-3 rounded-full shadow-neonSoft hover:shadow-neon transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
            Submit new event
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Live now" value={live.length} accent />
          <Stat label="Pending review" value={pending.length} warn={pending.length > 0} />
          <Stat label="Rejected" value={rejected.length} />
          <Stat label="Past" value={past.length} />
        </div>

        <Section title={`Pending review (${pending.length})`} empty="No events waiting for review.">
          {pending.map(e => <EventRow key={e.id} ev={e} />)}
        </Section>
        <Section title={`Live now (${live.length})`} empty="No live events. Submit one!">
          {live.map(e => <EventRow key={e.id} ev={e} />)}
        </Section>
        {rejected.length > 0 && (
          <Section title={`Rejected (${rejected.length})`}>
            {rejected.map(e => <EventRow key={e.id} ev={e} showReason />)}
          </Section>
        )}
        {past.length > 0 && (
          <Section title={`Past events (${past.length})`}>
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
  const arr = Array.isArray(children) ? children : (children ? [children] : []);
  return (
    <div className="mb-8">
      <div className="font-headline font-bold text-xl mb-3">{title}</div>
      {arr.length === 0 ? (
        <div className="text-ztext3 text-sm border border-dashed border-zborder rounded-2xl p-8 text-center">
          {empty || 'Nothing here.'}
        </div>
      ) : (
        <div className="space-y-2">{arr}</div>
      )}
    </div>
  );
}

function EventRow({ ev, showReason }) {
  const start = new Date(ev.start_datetime);
  const when = start.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const statusPill = {
    'PENDING_APPROVAL': { label: '⏳ Pending', cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
    'APPROVED_ACTIVE': { label: '✓ Live', cls: 'bg-zneon/20 text-zneon border-zneon/40' },
    'REJECTED':        { label: '✕ Rejected', cls: 'bg-red-500/20 text-red-300 border-red-500/40' },
    'EXPIRED':         { label: 'Past', cls: 'bg-white/10 text-ztext2 border-white/20' },
  }[ev.status] || { label: ev.status, cls: 'bg-white/10 text-ztext2' };

  return (
    <div className="bg-zcard border border-zborder rounded-xl p-3 flex items-start gap-3">
      <img src={ev.cover_image_url} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusPill.cls}`}>
            {statusPill.label}
          </span>
          {ev.is_featured ? <span className="text-zneon text-xs font-bold">★ Featured</span> : null}
        </div>
        <div className="font-semibold mt-1 truncate">{ev.title}</div>
        <div className="text-ztext3 text-xs mt-0.5">{when} · {ev.venue_name} · {ev.city}</div>
        {showReason && ev.rejection_reason && (
          <div className="mt-1.5 text-red-300 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1">
            <strong>Rejection reason:</strong> {ev.rejection_reason}
          </div>
        )}
      </div>
    </div>
  );
}
