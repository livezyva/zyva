"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getSavedIds } from '../lib/saved';
import { getBrowserSupabase, isAdminEmail } from '../lib/supabase';

async function fetchRole(supabase, userId) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    return data?.role || 'CITIZEN';
  } catch {
    return 'CITIZEN';
  }
}

export default function Header() {
  const pathname = usePathname();
  const [savedCount, setSavedCount] = useState(0);
  const [auth, setAuth] = useState({ ready: false, user: null, isAdmin: false, role: 'GUEST' });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const refresh = () => setSavedCount(getSavedIds().length);
    refresh();
    window.addEventListener('zyva:saved-changed', refresh);
    return () => window.removeEventListener('zyva:saved-changed', refresh);
  }, []);

  useEffect(() => {
    let subscription;

    const resolveAuth = async (user, supabase) => {
      const isAdmin = isAdminEmail(user?.email);
      const role = user ? (isAdmin ? 'ADMIN' : await fetchRole(supabase, user.id)) : 'GUEST';
      setAuth({ ready: true, user, isAdmin, role });
    };

    (async () => {
      try {
        const supabase = getBrowserSupabase();
        const { data } = await supabase.auth.getSession();
        await resolveAuth(data?.session?.user ?? null, supabase);

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          // Resolve outside Supabase's callback tick so profile lookups never block auth events.
          setTimeout(() => resolveAuth(session?.user ?? null, supabase), 0);
        });
        subscription = listener?.subscription;
      } catch {
        // Environment not configured — safely display the guest menu.
        setAuth({ ready: true, user: null, isAdmin: false, role: 'GUEST' });
      }
    })();

    return () => subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = (returnFocus = false) => {
    setMenuOpen(false);
    if (returnFocus) window.setTimeout(() => menuButtonRef.current?.focus(), 0);
  };

  const signOut = async () => {
    try {
      const supabase = getBrowserSupabase();
      await supabase.auth.signOut();
    } catch {}
    closeMenu();
    window.location.assign('/');
  };

  const displayName =
    auth.user?.user_metadata?.full_name ||
    auth.user?.user_metadata?.name ||
    auth.user?.email?.split('@')[0] ||
    'ZYVA member';
  const initials = getInitials(displayName);
  const roleLabel = auth.isAdmin ? 'ADMIN' : auth.role;
  const isOrganizer = auth.role === 'ORGANIZER';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zborder bg-black/85 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            className="group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white hover:bg-white/5 hover:text-zneon focus:outline-none focus-visible:ring-2 focus-visible:ring-zneon transition"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="zyva-navigation-drawer"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <Link href="/" className="ml-1 flex items-center gap-2.5 group" aria-label="ZYVA home">
            <span className="h-8 w-1 rounded-full bg-zneon shadow-neonSoft group-hover:shadow-neon transition" />
            <span className="font-headline font-bold text-xl tracking-[0.12em]">ZYVA</span>
            <span className="hidden sm:inline text-ztext3 text-xs ml-1 tracking-normal">/ Tonight in Cyprus</span>
          </Link>

          <div className="ml-auto flex items-center gap-2" aria-hidden="true">
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.18em] text-ztext3">Discover</span>
            <span className="h-2 w-2 rounded-full bg-zneon shadow-neonSoft animate-pulseNeon" />
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[100]" role="presentation">
          <button
            type="button"
            className="zyva-menu-backdrop absolute inset-0 h-full w-full cursor-default bg-black/75 backdrop-blur-sm"
            onClick={() => closeMenu(true)}
            aria-label="Close navigation menu"
          />

          <aside
            id="zyva-navigation-drawer"
            className="zyva-menu-drawer absolute inset-y-0 left-0 flex w-[86vw] max-w-[360px] flex-col overflow-hidden border-r border-zneon/25 bg-[#050505] shadow-[18px_0_60px_rgba(0,0,0,0.8)]"
            role="dialog"
            aria-modal="true"
            aria-label="ZYVA navigation"
          >
            <div className="h-16 shrink-0 flex items-center border-b border-zborder px-5">
              <Link href="/" onClick={() => closeMenu()} className="flex items-center gap-2.5" aria-label="ZYVA home">
                <span className="h-8 w-1 rounded-full bg-zneon shadow-neonSoft" />
                <span className="font-headline font-bold text-xl tracking-[0.14em]">ZYVA</span>
              </Link>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => closeMenu(true)}
                className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl text-ztext2 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zneon transition"
                aria-label="Close navigation menu"
              >
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              {!auth.ready ? (
                <div className="mx-2 mb-5 h-[76px] animate-pulse rounded-2xl border border-zborder bg-zcard" />
              ) : auth.user ? (
                <div className="mx-2 mb-5 flex items-center gap-3 rounded-2xl border border-zborder bg-zcard p-3.5">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zneon font-headline text-sm font-bold text-black shadow-neonSoft">
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-white">{displayName}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-ztext3">{auth.user.email}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-zneon/40 bg-zneon/10 px-2 py-1 text-[9px] font-bold tracking-wider text-zneon">
                    {roleLabel}
                  </span>
                </div>
              ) : (
                <div className="mx-2 mb-5 rounded-2xl border border-zborder bg-zcard p-4">
                  <div className="text-sm font-bold text-white">Welcome to ZYVA</div>
                  <div className="mt-1 text-xs leading-relaxed text-ztext3">Sign in to manage your account and list events.</div>
                </div>
              )}

              <MenuLabel>Explore</MenuLabel>
              <MenuLink href="/" active={pathname === '/'} icon={<HomeIcon />} onClick={() => closeMenu()}>
                Discover events
              </MenuLink>
              <MenuLink
                href="/saved"
                active={pathname === '/saved'}
                icon={<HeartIcon />}
                badge={savedCount > 0 ? savedCount : null}
                onClick={() => closeMenu()}
              >
                Saved events
              </MenuLink>

              {auth.ready && (
                <>
                  <div className="mx-3 my-3 h-px bg-zborder" />
                  <MenuLabel>{auth.isAdmin || isOrganizer ? 'Manage' : 'For organizers'}</MenuLabel>

                  {auth.isAdmin && (
                    <>
                      <MenuLink href="/admin" active={pathname.startsWith('/admin')} accent icon={<AdminIcon />} onClick={() => closeMenu()}>
                        Admin Portal
                      </MenuLink>
                      <MenuLink href="/organizer" active={pathname.startsWith('/organizer')} icon={<TicketIcon />} onClick={() => closeMenu()}>
                        Organizer Portal
                      </MenuLink>
                    </>
                  )}

                  {!auth.isAdmin && isOrganizer && (
                    <MenuLink href="/organizer" active={pathname.startsWith('/organizer')} accent icon={<TicketIcon />} onClick={() => closeMenu()}>
                      Organizer Portal
                    </MenuLink>
                  )}

                  {!auth.isAdmin && !isOrganizer && (
                    <MenuLink href="/apply" active={pathname.startsWith('/apply')} icon={<PlusIcon />} onClick={() => closeMenu()}>
                      Apply to list events
                    </MenuLink>
                  )}
                </>
              )}
            </div>

            <div className="shrink-0 border-t border-zborder bg-black/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {!auth.ready ? (
                <div className="h-11 animate-pulse rounded-xl bg-white/5" />
              ) : auth.user ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-ztext2 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zneon transition"
                >
                  <span className="text-ztext3"><SignOutIcon /></span>
                  Sign out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/auth"
                    onClick={() => closeMenu()}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-zborder text-sm font-semibold text-white hover:border-zneon hover:text-zneon transition"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    onClick={() => closeMenu()}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-zneon text-sm font-bold text-black shadow-neonSoft hover:shadow-neon transition"
                  >
                    Create account
                  </Link>
                </div>
              )}
              <div className="mt-3 text-center text-[9px] uppercase tracking-[0.16em] text-ztext3">Tonight in Cyprus</div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function MenuLabel({ children }) {
  return <div className="px-3 pb-1.5 pt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-ztext3">{children}</div>;
}

function MenuLink({ href, active, accent, icon, badge, onClick, children }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
        active
          ? 'bg-zneon/10 text-white'
          : accent
            ? 'text-zneon hover:bg-zneon/10'
            : 'text-ztext2 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'text-zneon' : 'text-ztext3 group-hover:text-zneon'}`}>
        {icon}
      </span>
      <span>{children}</span>
      {badge !== null && badge !== undefined && (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zneon px-1.5 text-[10px] font-bold text-black">
          {badge}
        </span>
      )}
      {!badge && <span className="ml-auto text-ztext3 group-hover:text-zneon">›</span>}
    </Link>
  );
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Z';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function HomeIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 10v10h13V10M9.5 20v-6h5v6"/></svg>;
}
function HeartIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 5.8a5.5 5.5 0 00-7.8 0L12 6.9l-1.1-1.1a5.5 5.5 0 00-7.8 7.8L12 22l8.8-8.4a5.5 5.5 0 000-7.8z"/></svg>;
}
function AdminIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4v5c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V7l8-4z"/><path d="M9 12l2 2 4-4"/></svg>;
}
function TicketIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16v4a2 2 0 000 4v4H4v-4a2 2 0 000-4V6z"/><path d="M12 7.5v2M12 11v2M12 14.5v2"/></svg>;
}
function PlusIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>;
}
function SignOutIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/></svg>;
}
