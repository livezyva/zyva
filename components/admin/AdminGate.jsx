"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBrowserSupabase, isAdminEmail } from '../../lib/supabase';
import { useLanguage } from '../LanguageProvider';

/**
 * Protects admin pages. Verifies session + admin whitelist.
 * `children` receives ({ user, signOut }) as render props.
 */
export default function AdminGate({ children }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    let cancelled = false;
    let sub;
    (async () => {
      let supabase;
      try { supabase = getBrowserSupabase(); }
      catch { setState({ status: 'misconfigured', user: null }); return; }

      const { data } = await supabase.auth.getSession();
      const u = data?.session?.user;
      if (cancelled) return;
      if (!u) { router.replace('/auth?next=/admin'); return; }
      if (!isAdminEmail(u.email)) { setState({ status: 'forbidden', user: u }); return; }
      setState({ status: 'ok', user: u });

      const { data: s } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) router.replace('/auth?next=/admin');
      });
      sub = s?.subscription;
    })();
    return () => { cancelled = true; sub?.unsubscribe?.(); };
  }, [router]);

  const signOut = async () => {
    try { const supabase = getBrowserSupabase(); await supabase.auth.signOut(); }
    finally { router.replace('/auth'); }
  };

  if (state.status === 'loading') {
    return <FullScreen msg={t('admin.checking')} />;
  }
  if (state.status === 'misconfigured') {
    return (
      <FullScreen>
        <div className="text-3xl mb-2">⚙️</div>
        <div className="font-headline font-bold text-xl">{t('admin.notConfigured')}</div>
        <p className="text-ztext2 text-sm mt-2 max-w-md mx-auto">{t('admin.notConfiguredBody')}</p>
        <Link href="/" className="mt-4 inline-block text-zneon text-sm hover:underline">{t('admin.backSite')}</Link>
      </FullScreen>
    );
  }
  if (state.status === 'forbidden') {
    return (
      <FullScreen>
        <div className="text-3xl mb-2">🚫</div>
        <div className="font-headline font-bold text-xl">{t('admin.notAdmin')}</div>
        <p className="text-ztext2 text-sm mt-2">{t('admin.notAdminBody', { email: state.user.email })}</p>
        <button onClick={signOut} className="mt-4 bg-zneon text-black font-bold px-4 py-2 rounded-full">
          {t('admin.signOut')}
        </button>
      </FullScreen>
    );
  }
  return children({ user: state.user, signOut });
}

function FullScreen({ msg, children }) {
  return (
    <div className="min-h-screen bg-zbg grid place-items-center px-6 text-center">
      <div>
        {msg && <div className="text-ztext3">{msg}</div>}
        {children}
      </div>
    </div>
  );
}
