import { getDb } from '../../../../lib/db';
import { verifyRequest, requireAdmin } from '../../../../lib/supabaseServer';
import { geocodeAddress } from '../../../../lib/geocode';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

/** Wrap everything so we always return JSON even on unexpected errors. */
async function safe(handler) {
  try { return await handler(); }
  catch (err) {
    console.error('[api/admin/events] ERROR:', err);
    return NextResponse.json(
      {
        error: err?.message || String(err),
        detail: err?.detail || null,
        code: err?.code || null,
        hint: err?.hint || null,
        where: err?.where || null,
      },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  return safe(async () => {
    const auth = await verifyRequest(req);
    const gate = requireAdmin(auth);
    if (gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const db = getDb();
    const rows = await db.all(
      `SELECT * FROM events ORDER BY start_datetime DESC LIMIT 500`, []
    );
    return NextResponse.json({ events: rows.map(normalize) });
  });
}

export async function POST(req) {
  return safe(async () => {
    const auth = await verifyRequest(req);
    const gate = requireAdmin(auth);
    if (gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const db = getDb();
    const body = await req.json();
    const err = validateEvent(body);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const id = randomUUID();
    const slug = slugify(body.title) + '-' + Math.random().toString(36).slice(2, 6);
    const durationDays = Math.max(1, Math.round(
      (new Date(body.end_datetime) - new Date(body.start_datetime)) / (24 * 3600 * 1000)
    ) || 1);

    // Geocode the address if lat/lng not provided
    let lat = body.latitude;
    let lng = body.longitude;
    if ((lat == null || lng == null || lat === '' || lng === '') && body.address) {
      const geo = await geocodeAddress(body.address, body.city);
      if (geo) { lat = geo.lat; lng = geo.lng; }
    }

    // Resolve venue: use existing or create a new one
    let venueId = body.venue_id;
    if (!venueId) {
      venueId = randomUUID();
      const vslug = slugify(body.venue_name) + '-' + Math.random().toString(36).slice(2, 4);
      const verifiedVal = db.kind === 'pg' ? true : 1;
      await db.run(
        `INSERT INTO venues (id, name, slug, city, address, latitude, longitude, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [venueId, body.venue_name, vslug, body.city, body.address, lat, lng, verifiedVal]
      );
    }

    // Boolean type differs: Postgres wants true/false, SQLite wants 1/0.
    const featuredVal = db.kind === 'pg' ? !!body.is_featured : (body.is_featured ? 1 : 0);

    await db.run(
      `INSERT INTO events
        (id, venue_id, title, slug, description, category, city, venue_name, address,
         latitude, longitude, start_datetime, end_datetime, cover_image_url, ticket_url,
         price_label, status, is_featured, listing_duration_days, daily_rate_eur,
         total_cost_eur, views_count, shares_count, expires_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, venueId, body.title, slug, body.description, body.category, body.city,
        body.venue_name, body.address, lat, lng,
        body.start_datetime, body.end_datetime, body.cover_image_url,
        body.ticket_url, body.price_label || 'Free Entry',
        body.status || 'APPROVED_ACTIVE', featuredVal,
        durationDays, 0, 0, 0, 0, body.end_datetime,
      ]
    );

    // Try to persist contact info & created_by — silently skip if columns missing
    try {
      await db.run(
        `UPDATE events SET contact_name = ?, contact_email = ?, contact_phone = ?, created_by = ?
         WHERE id = ?`,
        [body.contact_name || null, body.contact_email || null, body.contact_phone || null,
         auth.user.id, id]
      );
    } catch (e) {
      console.warn('[api/admin/events] contact columns update skipped:', e?.message);
    }

    const created = await db.get(`SELECT * FROM events WHERE id = ?`, [id]);
    return NextResponse.json({ event: normalize(created) }, { status: 201 });
  });
}

function normalize(r) {
  if (!r) return r;
  const out = { ...r };
  if (typeof out.is_featured === 'boolean') out.is_featured = out.is_featured ? 1 : 0;
  for (const k of ['start_datetime', 'end_datetime', 'created_at', 'expires_at']) {
    if (out[k] instanceof Date) out[k] = out[k].toISOString();
  }
  return out;
}

function validateEvent(b) {
  if (!b) return 'Missing body';
  if (!b.title || b.title.length > 150) return 'Title required (≤150 chars)';
  if (!b.description || b.description.length < 20) return 'Description ≥20 chars required';
  if (!b.category) return 'Category required';
  if (!b.city) return 'City required';
  if (!b.venue_name) return 'Venue name required';
  if (!b.address) return 'Address required';
  if (!b.cover_image_url) return 'Cover image required';
  if (!b.start_datetime || !b.end_datetime) return 'Start & end date/time required';
  if (new Date(b.end_datetime) <= new Date(b.start_datetime)) return 'End must be after start';
  return null;
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
}
