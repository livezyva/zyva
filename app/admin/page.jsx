"use client";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AdminGate from '../../components/admin/AdminGate';
import { getBrowserSupabase } from '../../lib/supabase';
import EventForm from '../../components/admin/EventForm';
import { useLanguage } from '../../components/LanguageProvider';

export default function AdminPage() {
  return (
    <AdminGate>
      {({ user, signOut }) => <AdminDashboard user={user} signOut={signOut} />}
    </AdminGate>
  );
}

function AdminDashboard({ user, signOut }) {
  const { language, setLanguage, t, localizeError } = useLanguage();
  const [tab, setTab] = useState('events'); // events | organizers
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // event object or null
  const [filter, setFilter] = useState('all');   // all | active | pending | featured | past
  const [search, setSearch] = useState('');

  const loadAll = async () => {
    setLoading(true); setError(null);
    try {
      const [evRes, veRes, apRes] = await Promise.all([
        authedFetch('/api/admin/events'),
        authedFetch('/api/admin/venues'),
        authedFetch('/api/admin/organizers?status=ALL'),
      ]);
      const ev = await evRes.json();
      const ve = await veRes.json();
      const ap = await apRes.json();
      if (!evRes.ok) throw new Error(ev?.error || t('errors.generic'));
      if (!veRes.ok) throw new Error(ve?.error || t('errors.generic'));
      setEvents(ev.events || []);
      setVenues(ve.venues || []);
      setApplications(ap.applications || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const q = search.trim().toLowerCase();
    return events.filter(e => {
      if (filter === 'active')   { if (e.status !== 'APPROVED_ACTIVE' || new Date(e.end_datetime) < now) return false; }
      if (filter === 'pending')  { if (e.status !== 'PENDING_APPROVAL') return false; }
      if (filter === 'featured') { if (!e.is_featured) return false; }
      if (filter === 'past')     { if (new Date(e.end_datetime) >= now) return false; }
      if (q) {
        const hay = `${e.title} ${e.venue_name} ${e.city} ${e.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, filter, search]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: events.length,
      active: events.filter(e => e.status === 'APPROVED_ACTIVE' && new Date(e.end_datetime) >= now).length,
      pending: events.filter(e => e.status === 'PENDING_APPROVAL').length,
      featured: events.filter(e => e.is_featured).length,
    };
  }, [events]);

  const toggleFeatured = async (ev) => {
    const res = await authedFetch(`/api/admin/events/${ev.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_featured: !ev.is_featured }),
    });
    if (!res.ok) { alert(t('admin.updateFailed')); return; }
    setEvents(list => list.map(x => x.id === ev.id ? { ...x, is_featured: !ev.is_featured } : x));
  };
  const remove = async (ev) => {
    if (!confirm(t('admin.deleteConfirm', { title: ev.title }))) return;
    const res = await authedFetch(`/api/admin/events/${ev.id}`, { method: 'DELETE' });
    if (!res.ok) { alert(t('admin.deleteFailed')); return; }
    setEvents(list => list.filter(x => x.id !== ev.id));
  };
  const approve = async (ev) => {
    const res = await authedFetch(`/api/admin/events/${ev.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'APPROVED_ACTIVE' }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(localizeError(data?.error, 'admin.approveFailed'));
      return;
    }
    setEvents(list => list.map(x => x.id === ev.id ? { ...x, ...(data?.event || {}), status: 'APPROVED_ACTIVE' } : x));
  };

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (ev) => { setEditing(ev); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };
  const onSaved = async () => { closeForm(); await loadAll(); };

  return (
    <div className="min-h-screen bg-zbg text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-40 backdrop-blur-lg bg-black/70 border-b border-zborder">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zneon shadow-neonSoft">
                <span className="font-headline font-bold text-black text-lg">Z</span>
              </span>
              <span className="font-headline font-bold text-xl">ZYVA</span>
            </Link>
            <span className="hidden sm:inline text-ztext3 text-xs">/ {t('role.admin')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="hidden sm:inline text-ztext2 hover:text-white px-3 py-1.5">{t('admin.viewSite')}</Link>
            <CleanupButton onDone={loadAll} />
            <GeocodeButton onDone={loadAll} />
            <div className="inline-flex rounded-full border border-zborder bg-zcard p-0.5" role="group" aria-label={t('language.label')}>
              <button type="button" onClick={() => setLanguage('en')} aria-pressed={language === 'en'}
                className={`rounded-full px-2 py-1 text-[10px] font-bold ${language === 'en' ? 'bg-zneon text-black' : 'text-ztext2'}`}>EN</button>
              <button type="button" onClick={() => setLanguage('el')} aria-pressed={language === 'el'}
                className={`rounded-full px-2 py-1 text-[10px] font-bold ${language === 'el' ? 'bg-zneon text-black' : 'text-ztext2'}`}>ΕΛ</button>
            </div>
            <span className="hidden sm:inline text-ztext3 text-xs">{user.email}</span>
            <button onClick={signOut} className="px-3 py-1.5 rounded-full border border-zborder text-white hover:border-zneon hover:text-zneon transition text-sm">
              {t('admin.signOut')}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-zborder">
          <TabButton active={tab === 'events'} onClick={() => setTab('events')}
            badge={stats.pending}>
            {t('admin.events')}
          </TabButton>
          <TabButton active={tab === 'organizers'} onClick={() => setTab('organizers')}
            badge={applications.filter(a => a.status === 'PENDING').length}>
            {t('admin.organizers')}
          </TabButton>
        </div>

        {tab === 'organizers' ? (
          <OrganizersPanel
            applications={applications}
            onReviewed={loadAll}
          />
        ) : (
        <>
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Stat label={t('admin.totalEvents')} value={stats.total} />
          <Stat label={t('admin.liveNow')} value={stats.active} accent />
          <Stat label={t('admin.pendingReview')} value={stats.pending} warn={stats.pending > 0} />
          <Stat label={t('admin.recommended')} value={stats.featured} />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ztext3 pointer-events-none">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3-3" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.search')}
              className="w-full bg-zcard border border-zborder rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-ztext3 focus:outline-none focus:border-zneon"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: t('admin.filterAll') },
              { id: 'active', label: t('admin.filterLive') },
              { id: 'pending', label: t('admin.filterPending') },
              { id: 'featured', label: t('admin.filterRecommended') },
              { id: 'past', label: t('admin.filterPast') },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  filter === t.id ? 'bg-zneon text-black border-zneon' : 'bg-zcard text-ztext2 border-zborder hover:border-zneon hover:text-zneon'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 bg-zneon text-black font-bold px-4 py-2.5 rounded-full shadow-neonSoft hover:shadow-neon transition whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
            {t('admin.newEvent')}
          </button>
        </div>

        {/* Table */}
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <SkeletonTable />
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-zborder rounded-2xl py-16 text-center text-ztext2">
            {t('admin.noMatch')}
          </div>
        ) : (
          <div className="overflow-x-auto bg-zcard border border-zborder rounded-2xl">
            <table className="w-full text-sm">
              <thead className="text-ztext3 text-xs uppercase tracking-wider border-b border-zborder">
                <tr>
                  <th className="text-left p-3 pl-4">{t('admin.colEvent')}</th>
                  <th className="text-left p-3 hidden md:table-cell">{t('admin.colWhen')}</th>
                  <th className="text-left p-3 hidden sm:table-cell">{t('admin.colStatus')}</th>
                  <th className="text-left p-3 hidden md:table-cell">{t('admin.colViews')}</th>
                  <th className="text-right p-3 pr-4">{t('admin.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ev => (
                  <EventRow
                    key={ev.id}
                    ev={ev}
                    onEdit={() => openEdit(ev)}
                    onDelete={() => remove(ev)}
                    onFeature={() => toggleFeatured(ev)}
                    onApprove={() => approve(ev)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>
        )}
      </main>

      {formOpen && (
        <EventForm
          key={editing?.id || 'new'}
          initial={editing}
          venues={venues}
          onClose={closeForm}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

async function authedFetch(url, opts = {}) {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...opts, headers });
}

function TabButton({ active, onClick, badge, children }) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-4 py-2.5 -mb-px border-b-2 text-sm font-semibold transition ${
        active
          ? 'border-zneon text-zneon'
          : 'border-transparent text-ztext2 hover:text-white'
      }`}
    >
      {children}
      {badge > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center px-1 rounded-full bg-yellow-500 text-black text-[10px] font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

function OrganizersPanel({ applications, onReviewed }) {
  const { t, locale, cityName } = useLanguage();
  const [filter, setFilter] = useState('PENDING');
  const [reviewing, setReviewing] = useState(null); // application being reviewed
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  const list = applications.filter(a => filter === 'ALL' || a.status === filter);

  const act = async (id, action, reason) => {
    setBusy(true);
    try {
      const res = await authedFetch(`/api/admin/organizers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, rejection_reason: reason }),
      });
      const data = await res.json();
      if (!res.ok) { alert(t('admin.actionFailed', { error: data?.error || t('errors.generic') })); return; }
      setReviewing(null);
      setRejectReason('');
      onReviewed && onReviewed();
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              filter === s
                ? 'bg-zneon text-black border-zneon'
                : 'bg-zcard text-ztext2 border-zborder hover:border-zneon hover:text-zneon'
            }`}>
            {{ PENDING: t('admin.applicationFilterPending'), APPROVED: t('admin.applicationFilterApproved'), REJECTED: t('admin.applicationFilterRejected'), ALL: t('admin.applicationFilterAll') }[s]}
            {s !== 'ALL' && (
              <span className="ml-1 text-[10px]">
                ({applications.filter(a => a.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="border border-dashed border-zborder rounded-2xl py-16 text-center text-ztext2">
          {t('admin.noApplications', { status: { PENDING: t('admin.applicationFilterPending'), APPROVED: t('admin.applicationFilterApproved'), REJECTED: t('admin.applicationFilterRejected'), ALL: t('admin.applicationFilterAll') }[filter].toLowerCase() })}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map(app => (
            <div key={app.id} className="bg-zcard border border-zborder rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-headline font-bold text-lg">{app.business_name}</div>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="text-ztext2 text-sm mt-0.5">
                    {cityName(app.city)} · {app.contact_name} · <a href={`mailto:${app.contact_email}`} className="text-zneon hover:underline">{app.contact_email}</a>
                    {app.contact_phone && <span> · {app.contact_phone}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                    {app.instagram_handle && (
                      <a href={`https://instagram.com/${app.instagram_handle.replace('@','')}`} target="_blank" rel="noreferrer"
                        className="text-ztext2 hover:text-zneon">
                        📷 {app.instagram_handle}
                      </a>
                    )}
                    {app.facebook_url && <a href={app.facebook_url} target="_blank" rel="noreferrer" className="text-ztext2 hover:text-zneon">📘 Facebook</a>}
                    {app.website_url && <a href={app.website_url} target="_blank" rel="noreferrer" className="text-ztext2 hover:text-zneon">🌐 {prettyDomain(app.website_url)}</a>}
                  </div>
                  {app.message && (
                    <div className="mt-2 text-ztext2 text-sm bg-black/40 border border-zborder rounded-lg p-2">
                      "{app.message}"
                    </div>
                  )}
                  {app.rejection_reason && (
                    <div className="mt-2 text-red-300 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1">
                      <strong>{t('admin.rejectedLabel')}</strong> {app.rejection_reason}
                    </div>
                  )}
                  <div className="text-ztext3 text-[11px] mt-2">
                    {t('admin.appliedDate', { date: new Date(app.created_at).toLocaleString(locale) })}
                    {app.reviewed_at && ` · ${t('admin.reviewedDate', { date: new Date(app.reviewed_at).toLocaleString(locale) })}`}
                  </div>
                </div>
                {app.status === 'PENDING' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => act(app.id, 'APPROVE')}
                      disabled={busy}
                      className="bg-zneon text-black font-bold text-xs px-3 py-2 rounded-full hover:shadow-neonSoft disabled:opacity-60">
                      ✓ {t('admin.approve')}
                    </button>
                    <button onClick={() => { setReviewing(app); setRejectReason(''); }}
                      disabled={busy}
                      className="border border-zborder text-red-300 font-semibold text-xs px-3 py-2 rounded-full hover:border-red-500 hover:bg-red-500/10 disabled:opacity-60">
                      ✕ {t('admin.reject')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-md bg-zcard border border-zborder rounded-2xl p-5">
            <div className="font-headline font-bold text-lg mb-1">{t('admin.rejectApplication')}</div>
            <div className="text-ztext2 text-sm mb-4">{t('admin.rejectHelp', { business: reviewing.business_name })}</div>
            <textarea rows={4} autoFocus value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={t('admin.rejectPlaceholder')}
              className="w-full bg-black/60 border border-zborder rounded-xl px-3 py-2 text-white placeholder-ztext3 focus:outline-none focus:border-zneon" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setReviewing(null)}
                className="px-4 py-2 rounded-full border border-zborder text-white text-sm">
                {t('common.cancel')}
              </button>
              <button onClick={() => act(reviewing.id, 'REJECT', rejectReason)}
                disabled={busy || !rejectReason.trim()}
                className="bg-red-500 text-white font-bold px-4 py-2 rounded-full text-sm disabled:opacity-60">
                {busy ? t('admin.sending') : t('admin.sendRejection')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const { t } = useLanguage();
  const map = {
    'PENDING':  { label: t('admin.applicationFilterPending'), cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
    'APPROVED': { label: t('admin.applicationFilterApproved'), cls: 'bg-zneon/20 text-zneon border-zneon/40' },
    'REJECTED': { label: t('admin.applicationFilterRejected'), cls: 'bg-red-500/20 text-red-300 border-red-500/40' },
  };
  const item = map[status] || { label: status, cls: 'bg-white/10 text-ztext2' };
  return <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${item.cls}`}>{item.label}</span>;
}

function prettyDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function Stat({ label, value, accent, warn }) {
  return (
    <div className={`rounded-2xl border p-4 ${
      accent ? 'bg-zneon/10 border-zneon/40' :
      warn   ? 'bg-yellow-500/10 border-yellow-500/40' :
               'bg-zcard border-zborder'
    }`}>
      <div className="text-ztext3 text-xs uppercase tracking-wider">{label}</div>
      <div className={`font-headline text-3xl font-bold mt-1 ${accent ? 'text-zneon' : warn ? 'text-yellow-400' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status, end }) {
  const { t } = useLanguage();
  const isPast = end && new Date(end) < new Date();
  const map = {
    'APPROVED_ACTIVE': isPast
      ? { label: t('admin.statusPast'), cls: 'bg-white/10 text-ztext2 border-white/20' }
      : { label: t('admin.statusLive'), cls: 'bg-zneon/20 text-zneon border-zneon/40' },
    'PENDING_APPROVAL': { label: t('admin.statusPending'), cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
    'PAYMENT_PENDING':  { label: t('admin.statusPayment'), cls: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    'REJECTED':         { label: t('admin.statusRejected'), cls: 'bg-red-500/20 text-red-300 border-red-500/40' },
    'EXPIRED':          { label: t('admin.statusExpired'), cls: 'bg-white/10 text-ztext2 border-white/20' },
    'DRAFT':            { label: t('admin.statusDraft'), cls: 'bg-white/5 text-ztext3 border-white/10' },
  };
  const item = map[status] || { label: status, cls: 'bg-white/10 text-ztext2 border-white/20' };
  return <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${item.cls}`}>{item.label}</span>;
}

function EventRow({ ev, onEdit, onDelete, onFeature, onApprove }) {
  const { t, locale, cityName, categoryName } = useLanguage();
  const when = new Date(ev.start_datetime).toLocaleString(locale, {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  return (
    <tr className="border-b border-zborder last:border-b-0 hover:bg-white/[0.02]">
      <td className="p-3 pl-4">
        <div className="flex items-start gap-3">
          <img src={ev.cover_image_url} alt="" className="w-14 h-14 object-cover rounded-lg shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-white leading-tight truncate flex items-center gap-1.5">
              {ev.is_featured && <span title={t('event.recommended')} className="text-zneon">★</span>}
              {ev.title}
            </div>
            <div className="text-ztext3 text-xs mt-0.5 truncate">
              {ev.venue_name} · {cityName(ev.city)} · {categoryName(ev.category)}
            </div>
            <div className="sm:hidden mt-1.5"><StatusPill status={ev.status} end={ev.end_datetime} /></div>
          </div>
        </div>
      </td>
      <td className="p-3 hidden md:table-cell text-ztext2 text-sm">{when}</td>
      <td className="p-3 hidden sm:table-cell"><StatusPill status={ev.status} end={ev.end_datetime} /></td>
      <td className="p-3 hidden md:table-cell text-ztext2 text-sm">{ev.views_count ?? 0}</td>
      <td className="p-3 pr-4">
        <div className="flex justify-end gap-1">
          {ev.status === 'PENDING_APPROVAL' && (
            <button onClick={onApprove} title={t('admin.approve')}
              className="px-2.5 py-1 rounded-full bg-zneon/20 text-zneon border border-zneon/40 text-xs font-bold hover:bg-zneon hover:text-black">
              {t('admin.approve')}
            </button>
          )}
          <button onClick={onFeature}
            title={ev.is_featured ? t('admin.removeRecommended') : t('admin.markRecommended')}
            className={`h-8 w-8 rounded-full border flex items-center justify-center transition ${
              ev.is_featured ? 'bg-zneon text-black border-zneon' : 'bg-zcard text-ztext2 border-zborder hover:border-zneon hover:text-zneon'
            }`}>
            ★
          </button>
          <button onClick={onEdit} title={t('admin.edit')}
            className="h-8 w-8 rounded-full border border-zborder text-ztext2 hover:border-zneon hover:text-zneon transition flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
          <button onClick={onDelete} title={t('admin.delete')}
            className="h-8 w-8 rounded-full border border-zborder text-ztext2 hover:border-red-500 hover:text-red-400 transition flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

function CleanupButton({ onDone }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!confirm(t('admin.cleanupConfirm'))) return;
    setBusy(true);
    try {
      const res = await authedFetch('/api/admin/cleanup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t('errors.generic'));
      alert(t('admin.cleanupDone', { deleted: data.deleted, days: data.retention_days }));
      onDone?.();
    } catch (error) { alert(t('admin.cleanupFailed', { error: error.message })); }
    finally { setBusy(false); }
  };
  return (
    <button onClick={run} disabled={busy} title={t('admin.cleanupTitle')}
      className="hidden sm:inline px-3 py-1.5 rounded-full border border-zborder text-ztext2 hover:border-zneon hover:text-zneon transition text-sm disabled:opacity-60">
      🧹 {busy ? t('admin.cleaning') : t('admin.cleanup')}
    </button>
  );
}

function GeocodeButton({ onDone }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!confirm(t('admin.geocodeConfirm'))) return;
    setBusy(true);
    try {
      const res = await authedFetch('/api/admin/geocode-missing', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t('errors.generic'));
      const notFoundList = (data.results || []).filter(result => result.status === 'not_found');
      let message = t('admin.geocodeSummary', {
        scanned: data.scanned, geocoded: data.geocoded, notFound: data.not_found,
      });
      if (notFoundList.length) {
        message += `\n\n${t('admin.couldNotFind')}\n` + notFoundList.slice(0, 5).map(result => `• ${result.title}`).join('\n');
      }
      alert(message);
      onDone?.();
    } catch (error) { alert(t('admin.geocodeFailed', { error: error.message })); }
    finally { setBusy(false); }
  };
  return (
    <button onClick={run} disabled={busy} title={t('admin.geocodeTitle')}
      className="hidden sm:inline px-3 py-1.5 rounded-full border border-zborder text-ztext2 hover:border-zneon hover:text-zneon transition text-sm disabled:opacity-60">
      📍 {busy ? t('admin.locating') : t('admin.fixPins')}
    </button>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-zcard border border-zborder rounded-2xl divide-y divide-zborder">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
          <div className="w-14 h-14 rounded-lg bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/10 rounded w-1/3" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
