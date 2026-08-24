"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getBrowserSupabase } from '../../lib/supabase';
import { useLanguage } from '../../components/LanguageProvider';

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthInner />
    </Suspense>
  );
}

function AuthLoading() {
  const { t } = useLanguage();
  return <Shell><div className="text-ztext3">{t('auth.loading')}</div></Shell>;
}

function AuthInner() {
  const { t, localizeError } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get('next') || '/';
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'signin';

  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [envMissing, setEnvMissing] = useState(false);

  // If already signed in, bounce back
  useEffect(() => {
    (async () => {
      try {
        const supabase = getBrowserSupabase();
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) router.replace(nextUrl);
      } catch { setEnvMissing(true); }
    })();
  }, [router, nextUrl]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setInfo(null); setBusy(true);
    try {
      const supabase = getBrowserSupabase();
      if (mode === 'signup') {
        const emailRedirectTo = typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`
          : undefined;
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setInfo(t('auth.confirmEmail'));
          setMode('signin');
        } else if (data.session) {
          router.replace(nextUrl);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(nextUrl);
      }
    } catch (err) {
      setError(prettifyError(err, t));
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null); setInfo(null); setBusy(true);
    try {
      const supabase = getBrowserSupabase();
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`
        : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
      // The browser is being redirected to Google; nothing else to do here.
    } catch (err) {
      setError(prettifyError(err, t));
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    setError(null); setInfo(null);
    if (!email) { setError(t('auth.emailFirst')); return; }
    try {
      const supabase = getBrowserSupabase();
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/reset` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setInfo(t('auth.resetSent'));
    } catch (err) { setError(prettifyError(err, t)); }
  };

  if (envMissing) {
    return (
      <Shell>
        <h1 className="font-headline text-2xl font-bold mb-3">{t('auth.notConfigured')}</h1>
        <p className="text-ztext2 text-sm">{t('auth.notConfiguredBody')}</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zneon shadow-neon mb-3">
          <span className="font-headline font-bold text-black text-2xl">Z</span>
        </Link>
        <h1 className="font-headline text-3xl font-bold">
          {mode === 'signup' ? t('auth.createTitle') : t('auth.welcomeBack')}
        </h1>
        <p className="text-ztext2 text-sm mt-1">
          {mode === 'signup'
            ? t('auth.createBody')
            : t('auth.signInBody')}
        </p>
      </div>

      {/* Google Sign-In */}
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold px-5 py-3 rounded-xl hover:bg-gray-100 hover:shadow-lg transition disabled:opacity-60 mb-4"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
        </svg>
        {t('auth.google')}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-zborder"></div>
        <span className="text-ztext3 text-xs uppercase tracking-wider">{t('auth.orEmail')}</span>
        <div className="h-px flex-1 bg-zborder"></div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <Field label={t('auth.yourName')}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder={t('auth.namePlaceholder')}
              autoComplete="name"
            />
          </Field>
        )}

        <Field label={t('auth.yourEmail')}>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder={t('auth.emailPlaceholder')}
          />
        </Field>

        <Field label={t('auth.yourPassword')}>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder={mode === 'signup' ? t('auth.newPasswordPlaceholder') : t('auth.passwordPlaceholder')}
          />
        </Field>

        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</div>}
        {info  && <div className="text-sm text-zneon bg-zneon/10 border border-zneon/30 rounded-xl px-3 py-2">{info}</div>}

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 bg-zneon text-black font-bold px-5 py-3 rounded-xl shadow-neonSoft hover:shadow-neon transition disabled:opacity-60"
        >
          {busy ? t('common.pleaseWait') : mode === 'signup' ? t('auth.createAccount') : t('auth.signIn')}
        </button>

        <div className="flex items-center justify-between text-xs text-ztext3 pt-2">
          <button
            type="button"
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }}
            className="hover:text-zneon underline underline-offset-2"
          >
            {mode === 'signin' ? t('auth.noAccount') : t('auth.haveAccount')}
          </button>
          {mode === 'signin' && (
            <button type="button" onClick={forgotPassword} className="hover:text-white">
              {t('auth.forgot')}
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 pt-4 border-t border-zborder text-center">
        <Link href="/" className="text-ztext3 text-xs hover:text-white">{t('auth.back')}</Link>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          background: rgba(0,0,0,0.55);
          border: 1px solid var(--zyva-card-border, #222);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          color: #fff;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .input:focus {
          outline: none;
          border-color: var(--zyva-neon-green, #1DB954);
          box-shadow: 0 0 12px rgba(29,185,84,0.25);
        }
        .input::placeholder { color: #666; }
      `}</style>
    </Shell>
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

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-zbg grid place-items-center px-4 py-10">
      <div className="w-full max-w-md bg-zcard border border-zborder rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60">
        {children}
      </div>
    </div>
  );
}

function prettifyError(err, t) {
  const msg = err?.message || String(err);
  if (/invalid.*credentials/i.test(msg)) return t('auth.wrongCredentials');
  if (/email.*not.*confirmed/i.test(msg)) return t('auth.confirmFirst');
  if (/already.*registered/i.test(msg)) return t('auth.alreadyRegistered');
  if (/network|fetch/i.test(msg)) return t('auth.networkError');
  return msg;
}
