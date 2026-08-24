"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getBrowserSupabase } from '../../../lib/supabase';
import { useLanguage } from '../../../components/LanguageProvider';

export default function AuthCallback() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <Inner />
    </Suspense>
  );
}

function CallbackLoading() {
  const { t } = useLanguage();
  return <Shell msg={t('common.loading')} />;
}

function Inner() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get('next') || '/';
  const [msg, setMsg] = useState(t('auth.signingIn'));

  useEffect(() => {
    (async () => {
      try {
        const supabase = getBrowserSupabase();
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setMsg(t('auth.signedIn'));
          setTimeout(() => router.replace(nextUrl), 400);
        } else {
          setMsg(t('auth.linkProcessed'));
          setTimeout(() => router.replace('/auth'), 1200);
        }
      } catch {
        setMsg(t('auth.callbackError'));
        setTimeout(() => router.replace('/auth'), 1200);
      }
    })();
  }, [router, nextUrl, t]);

  return <Shell msg={msg} />;
}

function Shell({ msg }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-zbg grid place-items-center px-4">
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zneon shadow-neon mb-3 animate-pulseNeon">
          <span className="font-headline font-bold text-black text-2xl">Z</span>
        </div>
        <div className="text-white font-headline text-lg">{msg}</div>
        <Link href="/" className="text-ztext3 text-xs mt-3 inline-block hover:text-white">{t('auth.back')}</Link>
      </div>
    </div>
  );
}
