"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getBrowserSupabase } from '../../../lib/supabase';

export default function AuthCallback() {
  return (
    <Suspense fallback={<Shell msg="Loading…" />}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get('next') || '/';
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    (async () => {
      try {
        const supabase = getBrowserSupabase();
        // Supabase v2 auto-parses the URL fragment via detectSessionInUrl: true,
        // so simply re-checking the session here is enough.
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setMsg('Signed in — redirecting…');
          setTimeout(() => router.replace(nextUrl), 400);
        } else {
          setMsg('Sign-in link processed. Please sign in with your password.');
          setTimeout(() => router.replace('/auth'), 1200);
        }
      } catch (e) {
        setMsg('Something went wrong. Redirecting to sign in…');
        setTimeout(() => router.replace('/auth'), 1200);
      }
    })();
  }, [router, nextUrl]);

  return <Shell msg={msg} />;
}

function Shell({ msg }) {
  return (
    <div className="min-h-screen bg-zbg grid place-items-center px-4">
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zneon shadow-neon mb-3 animate-pulseNeon">
          <span className="font-headline font-bold text-black text-2xl">Z</span>
        </div>
        <div className="text-white font-headline text-lg">{msg}</div>
        <Link href="/" className="text-ztext3 text-xs mt-3 inline-block hover:text-white">← Back to ZYVA</Link>
      </div>
    </div>
  );
}
