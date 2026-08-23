// Server-side auth helpers used by API routes.
import { createClient } from '@supabase/supabase-js';

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function getAdminSet() {
  const raw = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  return new Set(raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean));
}

/** Verify the Bearer token from an incoming request. */
export async function verifyRequest(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return { user: null, isAdmin: false, role: null };
  const sb = serverClient();
  if (!sb) return { user: null, isAdmin: false, role: null };
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return { user: null, isAdmin: false, role: null };
  const admins = getAdminSet();
  const email = (data.user.email || '').toLowerCase();
  const isAdmin = admins.has(email);

  // Load profile role from DB (only if not admin — admin overrides everything)
  let role = 'CITIZEN';
  if (isAdmin) role = 'ADMIN';
  else {
    try {
      const { data: prof } = await sb.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      if (prof?.role) role = prof.role;
    } catch {}
  }
  return { user: data.user, isAdmin, role };
}

export function requireAdmin(auth) {
  if (!auth?.user) return { status: 401, error: 'Not signed in' };
  if (!auth.isAdmin) return { status: 403, error: 'Not authorized' };
  return null;
}

export function requireAuth(auth) {
  if (!auth?.user) return { status: 401, error: 'Not signed in' };
  return null;
}

export function requireOrganizer(auth) {
  if (!auth?.user) return { status: 401, error: 'Not signed in' };
  if (auth.isAdmin) return null; // admin can do anything
  if (auth.role !== 'ORGANIZER') return { status: 403, error: 'Not an approved organizer' };
  return null;
}
