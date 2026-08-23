// Supabase client for browser use (auth + client-side queries).
// The server-side verifier lives in lib/supabaseServer.js.
//
// Required env vars (add these in Netlify → Environment variables):
//   NEXT_PUBLIC_SUPABASE_URL       — from Supabase dashboard → Project Settings → API
//   NEXT_PUBLIC_SUPABASE_ANON_KEY  — same page, the "anon public" key
//   NEXT_PUBLIC_ADMIN_EMAILS       — comma-separated list of admin emails (e.g. livezyva@gmail.com)

import { createClient } from '@supabase/supabase-js';

let _browserClient;

export function getBrowserSupabase() {
  if (_browserClient) return _browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }
  _browserClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'zyva-auth',
    },
  });
  return _browserClient;
}

export function getAdminEmails() {
  const raw =
    (typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_ADMIN_EMAILS : (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS)) || '';
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email) {
  if (!email) return false;
  const normalized = String(email).trim().toLowerCase();
  const admins = getAdminEmails();
  // Debug log — visible in browser console
  if (typeof window !== 'undefined') {
    console.log('[ZYVA admin check]', { email: normalized, admins, isAdmin: admins.includes(normalized) });
  }
  return admins.includes(normalized);
}

/** Convenience: returns { user, session, isAdmin, role } from the current browser session. */
export async function getCurrentAuth() {
  try {
    const supabase = getBrowserSupabase();
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user ?? null;
    const isAdmin = isAdminEmail(user?.email);
    let role = 'GUEST';
    if (isAdmin) role = 'ADMIN';
    else if (user) {
      role = 'CITIZEN';
      try {
        const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (prof?.role) role = prof.role;
      } catch {}
    }
    return {
      user,
      session: data?.session ?? null,
      isAdmin,
      role,
    };
  } catch {
    return { user: null, session: null, isAdmin: false, role: 'GUEST' };
  }
}

/** Get JWT for API calls. */
export async function getAuthToken() {
  try {
    const supabase = getBrowserSupabase();
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch { return null; }
}
