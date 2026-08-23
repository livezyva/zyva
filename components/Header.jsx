"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getSavedIds } from '../lib/saved';
import { getBrowserSupabase, isAdminEmail } from '../lib/supabase';

async function fetchRole(supabase, userId) {
  try {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    return data?.role || 'CITIZEN';
  } catch { return 'CITIZEN'; }
}

export default function Header() {
  const [savedCount, setSavedCount] = useState(0);
  const [auth, setAuth] = useState({ ready: false, user: null, isAdmin: false, role: 'GUEST' });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const refresh = () => setSavedCount(getSavedIds().length);
    refresh();
    window.addEventListener('zyva:saved-changed', refresh);
    return () => window.removeEventListener('zyva:saved-changed', refresh);
  }, []);

  useEffect(() => {
    let sub;
    (async () => {
      try {
        const supabase = getBrowserSupabase();
        const { data } = await supabase.auth.getSession();
        const u = data?.session?.user ?? null;
        const isAdmin0 = isAdminEmail(u?.email);
        const role0 = u ? (isAdmin0 ? 'ADMIN' : await fetchRole(supabase, u.id)) : 'GUEST';
        setAuth({ ready: true, user: u, isAdmin: isAdmin0, role: role0 });
        const { data: s } = supabase.auth.onAuthStateChange(async (_e, session) => {
          const nu = session?.user ?? null;
          const isAdmin1 = isAdminEmail(nu?.email);
          const role1 = nu ? (isAdmin1 ? 'ADMIN' : await fetchRole(supabase, nu.id)) : 'GUEST';
          setAuth({ ready: true, user: nu, isAdmin: isAdmin1, role: role1 });
        });
        sub = s?.subscription;
      } catch {
        // env not configured — treat as guest
        setAuth({ ready: true, user: null, isAdmin: false, role: 'GUEST' });
      }
    })();
    return () => sub?.unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const signOut = async () => {
    try {
      const supabase = getBrowserSupabase();
      await supabase.auth.signOut();
    } catch {}
    setMenuOpen(false);
  };

  const displayName = auth.user?.user_metadata?.full_name || auth.user?.email?.split('@')[0] || '';
  const avatar = (displayName || 'U').slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-lg bg-black/70 border-b border-zborder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zneon shadow-neonSoft group-hover:shadow-neon transition">
            <span className="font-headline font-bold text-black text-lg">Z</span>
          </span>
          <span className="font-headline font-bold text-xl tracking-tight">ZYVA</span>
          <span className="hidden sm:inline text-ztext3 text-xs ml-2">/ Tonight in Cyprus</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3 text-sm">
          <Link href="/saved" className="relative px-3 py-1.5 rounded-full border border-zborder hover:border-zneon hover:text-zneon transition">
            Saved
            {savedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-zneon text-black text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </Link>

          {/* Contextual "List event" / "New event" CTA */}
          {auth.ready && !auth.isAdmin && (
            auth.role === 'ORGANIZER' ? (
              <Link href="/organizer"
                className="hidden sm:inline px-3 py-1.5 rounded-full bg-zneon/15 text-zneon border border-zneon/50 hover:bg-zneon hover:text-black font-semibold transition">
                + New event
              </Link>
            ) : (
              <Link href="/apply"
                className="hidden sm:inline px-3 py-1.5 rounded-full border border-zborder text-ztext2 hover:border-zneon hover:text-zneon transition">
                List an event
              </Link>
            )
          )}

          {auth.isAdmin && (
            <Link
              href="/admin"
              className="hidden sm:inline px-3 py-1.5 rounded-full bg-zneon/15 text-zneon border border-zneon/50 hover:bg-zneon hover:text-black font-semibold transition"
            >
              Admin
            </Link>
          )}

          {!auth.ready ? (
            <span className="hidden sm:inline w-20 h-7 rounded-full bg-white/5 animate-pulse" />
          ) : auth.user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-zborder hover:border-zneon transition"
                aria-label="Account menu"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zneon text-black font-bold">
                  {avatar}
                </span>
                <span className="hidden sm:inline text-white font-semibold text-sm max-w-[10ch] truncate">{displayName}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zcard border border-zborder rounded-2xl shadow-2xl shadow-black/60 py-1 overflow-hidden">
                  <div className="px-4 py-2 border-b border-zborder">
                    <div className="text-white text-sm font-semibold truncate">{displayName}</div>
                    <div className="text-ztext3 text-xs truncate">{auth.user.email}</div>
                  </div>
                  <Link href="/saved" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-white hover:bg-white/5">
                    Saved events
                  </Link>
                  {auth.role === 'ORGANIZER' && (
                    <Link href="/organizer" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-zneon font-semibold hover:bg-zneon/10">
                      🎪 Organizer dashboard
                    </Link>
                  )}
                  {auth.role === 'CITIZEN' && !auth.isAdmin && (
                    <Link href="/apply" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-white hover:bg-white/5">
                      Apply to list events
                    </Link>
                  )}
                  {auth.isAdmin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-zneon font-semibold hover:bg-zneon/10">
                      ★ Admin panel
                    </Link>
                  )}
                  <button
                    onClick={signOut}
                    className="w-full text-left block px-4 py-2 text-sm text-white hover:bg-white/5 border-t border-zborder"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth?mode=signup" className="hidden sm:inline px-3 py-1.5 rounded-full border border-zborder text-ztext2 hover:border-zneon hover:text-zneon transition">
                Sign up
              </Link>
              <Link href="/auth" className="px-3 py-1.5 rounded-full bg-zneon text-black font-semibold hover:shadow-neon transition">
                Sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
