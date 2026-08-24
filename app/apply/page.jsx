"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { getBrowserSupabase, getAuthToken, getCurrentAuth } from '../../lib/supabase';
import { useLanguage } from '../../components/LanguageProvider';

const CITIES = ['Limassol', 'Nicosia', 'Paphos', 'Larnaca', 'Ayia Napa'];

export default function ApplyPage() {
  const { t, locale, cityName, localizeError } = useLanguage();
  const router = useRouter();
  const [state, setState] = useState({ loading: true, auth: null, application: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    business_name: '', contact_name: '', contact_email: '',
    contact_phone: '', city: 'Limassol', instagram_handle: '',
    facebook_url: '', website_url: '', message: '',
  });

  useEffect(() => {
    (async () => {
      const auth = await getCurrentAuth();
      if (!auth.user) {
        router.replace('/auth?next=/apply');
        return;
      }
      // Pre-fill contact fields from user metadata
      setForm(f => ({
        ...f,
        contact_email: f.contact_email || auth.user.email || '',
        contact_name: f.contact_name || auth.user.user_metadata?.full_name || '',
      }));
      // Check for existing application
      const token = await getAuthToken();
      const res = await fetch('/api/organizer/apply', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.application) {
        setForm(f => ({ ...f, ...data.application }));
      }
      setState({ loading: false, auth, application: data.application || null });
    })();
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setSaving(true);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/organizer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t('apply.failed'));
      setState(s => ({ ...s, application: { ...form, status: 'PENDING' } }));
    } catch (err) { setError(localizeError(err, 'apply.failed')); }
    finally { setSaving(false); }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-zbg text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-ztext3">{t('common.loading')}</div>
      </div>
    );
  }

  const app = state.application;
  const isOrganizer = state.auth.role === 'ORGANIZER' || state.auth.role === 'ADMIN';

  // Already an organizer? Direct to submit form.
  if (isOrganizer) {
    return (
      <div className="min-h-screen bg-zbg text-white">
        <Header />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <StatusCard
            emoji="✅"
            title={t('apply.approvedTitle')}
            body={t('apply.approvedBody')}
            action={<Link href="/organizer" className="bg-zneon text-black font-bold px-5 py-2.5 rounded-full">{t('apply.goDashboard')}</Link>}
          />
        </main>
      </div>
    );
  }

  // Pending application
  if (app && app.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-zbg text-white">
        <Header />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <StatusCard
            emoji="⏳"
            title={t('apply.pendingTitle')}
            body={t('apply.pendingBody')}
            meta={t('apply.applied', { date: new Date(app.created_at).toLocaleString(locale) })}
            action={<Link href="/" className="text-ztext2 hover:text-white">{t('auth.back')}</Link>}
          />
        </main>
      </div>
    );
  }

  // Rejected — allow re-application
  const isRejected = app && app.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-zbg text-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="text-ztext3 text-xs uppercase tracking-wider">{t('apply.become')}</div>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold mt-1">{t('apply.title')}</h1>
          <p className="text-ztext2 mt-2">
            {t('apply.introBefore')} <span className="text-zneon font-semibold">{t('apply.introFree')}</span>.
          </p>
        </div>

        {isRejected && (
          <div className="mb-5 border border-red-500/40 bg-red-500/10 rounded-xl p-4">
            <div className="font-semibold text-red-300">{t('apply.rejectedTitle')}</div>
            {app.rejection_reason && <div className="text-red-200/80 text-sm mt-1">{t('apply.reason', { reason: app.rejection_reason })}</div>}
            <div className="text-red-200/80 text-sm mt-2">{t('apply.reapplyBody')}</div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-5 bg-zcard border border-zborder rounded-2xl p-5 sm:p-6">
          <Section title={t('apply.aboutBusiness')}>
            <Field label={t('apply.businessName')}>
              <input required maxLength={150} className="input" value={form.business_name}
                onChange={e => setForm({ ...form, business_name: e.target.value })}
                placeholder={t('apply.businessPlaceholder')} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('apply.city')}>
                <select required className="input" value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}>
                  {CITIES.map(c => <option key={c} value={c}>{cityName(c)}</option>)}
                </select>
              </Field>
              <Field label={t('apply.instagram')}>
                <input className="input" value={form.instagram_handle}
                  onChange={e => setForm({ ...form, instagram_handle: e.target.value })}
                  placeholder={t('apply.instagramPlaceholder')} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('apply.facebook')}>
                <input className="input" value={form.facebook_url}
                  onChange={e => setForm({ ...form, facebook_url: e.target.value })}
                  placeholder={t('apply.facebookPlaceholder')} />
              </Field>
              <Field label={t('apply.website')}>
                <input className="input" value={form.website_url}
                  onChange={e => setForm({ ...form, website_url: e.target.value })}
                  placeholder={t('apply.websitePlaceholder')} />
              </Field>
            </div>
          </Section>

          <Section title={t('apply.contact')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('apply.fullName')}>
                <input required maxLength={100} className="input" value={form.contact_name}
                  onChange={e => setForm({ ...form, contact_name: e.target.value })}
                  placeholder={t('apply.fullNamePlaceholder')} />
              </Field>
              <Field label={t('apply.phone')}>
                <input className="input" value={form.contact_phone}
                  onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder={t('apply.phonePlaceholder')} />
              </Field>
            </div>
            <Field label={t('apply.email')}>
              <input required type="email" className="input" value={form.contact_email}
                onChange={e => setForm({ ...form, contact_email: e.target.value })}
                placeholder={t('apply.emailPlaceholder')} />
            </Field>
          </Section>

          <Section title={t('apply.anythingElse')}>
            <Field label={t('apply.message')}>
              <textarea rows={3} className="input" value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder={t('apply.messagePlaceholder')} />
            </Field>
          </Section>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link href="/" className="text-ztext2 hover:text-white text-sm">{t('auth.back')}</Link>
            <button type="submit" disabled={saving}
              className="bg-zneon text-black font-bold px-6 py-3 rounded-full shadow-neonSoft hover:shadow-neon transition disabled:opacity-60">
              {saving ? t('apply.submitting') : isRejected ? t('apply.resubmit') : t('apply.submit')}
            </button>
          </div>
        </form>
      </main>
      <style jsx>{`
        .input {
          width: 100%; background: rgba(0,0,0,0.55); border: 1px solid #222;
          border-radius: 0.75rem; padding: 0.7rem 0.9rem; color: #fff; font-size: 0.9rem;
        }
        .input:focus { outline: none; border-color: #1DB954; box-shadow: 0 0 12px rgba(29,185,84,0.25); }
        .input::placeholder { color: #666; }
      `}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <div className="text-zneon text-xs font-bold uppercase tracking-wider">{title}</div>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-ztext3 text-xs uppercase tracking-wider mb-1">{label}</div>
      {children}
    </label>
  );
}
function StatusCard({ emoji, title, body, meta, action }) {
  return (
    <div className="bg-zcard border border-zborder rounded-2xl p-6 sm:p-10 text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <h2 className="font-headline text-2xl sm:text-3xl font-bold">{title}</h2>
      <p className="text-ztext2 mt-2 max-w-lg mx-auto">{body}</p>
      {meta && <div className="text-ztext3 text-xs mt-3">{meta}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
