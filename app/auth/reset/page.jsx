"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBrowserSupabase } from '../../../lib/supabase';
import { useLanguage } from '../../../components/LanguageProvider';

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getBrowserSupabase();
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) setReady(true);
        else setError(t('auth.resetInvalid'));
      } catch { setError(t('auth.notConfigured')); }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setInfo(null); setBusy(true);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setInfo(t('auth.passwordUpdated'));
      setTimeout(() => router.replace('/'), 900);
    } catch (err) { setError(err.message || t('auth.somethingWrong')); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-zbg grid place-items-center px-4">
      <div className="w-full max-w-md bg-zcard border border-zborder rounded-3xl p-6 sm:p-8">
        <h1 className="font-headline text-2xl font-bold mb-1">{t('auth.setPassword')}</h1>
        <p className="text-ztext2 text-sm mb-5">{t('auth.setPasswordBody')}</p>
        {ready ? (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/55 border border-zborder rounded-xl px-4 py-3 text-white placeholder-ztext3 focus:outline-none focus:border-zneon"
              placeholder={t('auth.newPasswordPlaceholder')}
              autoFocus
            />
            {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</div>}
            {info && <div className="text-sm text-zneon bg-zneon/10 border border-zneon/30 rounded-xl px-3 py-2">{info}</div>}
            <button disabled={busy} className="w-full bg-zneon text-black font-bold px-5 py-3 rounded-xl">
              {busy ? t('common.pleaseWait') : t('auth.updatePassword')}
            </button>
          </form>
        ) : (
          <>
            {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</div>}
            <Link href="/auth" className="mt-4 inline-block text-zneon text-sm hover:underline">{t('auth.backSignIn')}</Link>
          </>
        )}
      </div>
    </div>
  );
}
