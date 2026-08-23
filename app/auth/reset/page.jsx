"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBrowserSupabase } from '../../../lib/supabase';

export default function ResetPasswordPage() {
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
        else setError('This reset link is expired or invalid. Request a new one from the sign-in page.');
      } catch { setError('Auth is not configured yet.'); }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setInfo(null); setBusy(true);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setInfo('Password updated. Redirecting…');
      setTimeout(() => router.replace('/'), 900);
    } catch (err) { setError(err.message || 'Something went wrong'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-zbg grid place-items-center px-4">
      <div className="w-full max-w-md bg-zcard border border-zborder rounded-3xl p-6 sm:p-8">
        <h1 className="font-headline text-2xl font-bold mb-1">Set a new password</h1>
        <p className="text-ztext2 text-sm mb-5">Choose a new password for your account.</p>
        {ready ? (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/55 border border-zborder rounded-xl px-4 py-3 text-white placeholder-ztext3 focus:outline-none focus:border-zneon"
              placeholder="New password (min 6 chars)"
              autoFocus
            />
            {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</div>}
            {info && <div className="text-sm text-zneon bg-zneon/10 border border-zneon/30 rounded-xl px-3 py-2">{info}</div>}
            <button disabled={busy} className="w-full bg-zneon text-black font-bold px-5 py-3 rounded-xl">
              {busy ? 'Please wait…' : 'Update password'}
            </button>
          </form>
        ) : (
          <>
            {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</div>}
            <Link href="/auth" className="mt-4 inline-block text-zneon text-sm hover:underline">← Back to sign in</Link>
          </>
        )}
      </div>
    </div>
  );
}
