import { getDb } from '../../../lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');
  const category = searchParams.get('category');
  const timeframe = searchParams.get('timeframe');
  const q = searchParams.get('q');
  const featuredOnly = searchParams.get('featured') === '1';
  const includeVenue = searchParams.get('include_venue') === '1';

  const clauses = ["e.status = 'APPROVED_ACTIVE'"];
  const params = [];

  if (city && city !== 'All') { clauses.push('e.city = ?'); params.push(city); }
  if (category && category !== 'All') { clauses.push('e.category = ?'); params.push(category); }
  if (featuredOnly) clauses.push(db.kind === 'pg' ? 'e.is_featured = true' : 'e.is_featured = 1');

  if (q) {
    clauses.push('(LOWER(e.title) LIKE ? OR LOWER(e.description) LIKE ? OR LOWER(COALESCE(e.description_el, \'\')) LIKE ? OR LOWER(e.venue_name) LIKE ? OR LOWER(e.category) LIKE ?)');
    const like = '%' + q.toLowerCase() + '%';
    params.push(like, like, like, like, like);
  }

  const now = new Date();
  const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
  const startOfTomorrow = new Date(endOfToday); startOfTomorrow.setSeconds(startOfTomorrow.getSeconds() + 1);
  const endOfTomorrow = new Date(startOfTomorrow); endOfTomorrow.setHours(23, 59, 59, 999);
  const day = now.getDay();
  const daysToFri = (5 - day + 7) % 7;
  const fri = new Date(now); fri.setDate(fri.getDate() + daysToFri); fri.setHours(0, 0, 0, 0);
  const sun = new Date(fri); sun.setDate(fri.getDate() + 2); sun.setHours(23, 59, 59, 999);

  if (timeframe === 'tonight') {
    clauses.push('e.start_datetime <= ? AND e.end_datetime >= ?');
    params.push(endOfToday.toISOString(), now.toISOString());
  } else if (timeframe === 'tomorrow') {
    clauses.push('e.start_datetime >= ? AND e.start_datetime <= ?');
    params.push(startOfTomorrow.toISOString(), endOfTomorrow.toISOString());
  } else if (timeframe === 'weekend') {
    clauses.push('e.start_datetime >= ? AND e.start_datetime <= ?');
    params.push(fri.toISOString(), sun.toISOString());
  } else if (timeframe === 'upcoming') {
    clauses.push('e.start_datetime > ?');
    params.push(sun.toISOString());
  } else {
    clauses.push('e.end_datetime >= ?');
    params.push(now.toISOString());
  }

  const venueCols = includeVenue
    ? `, v.instagram_handle AS venue_instagram, v.facebook_url AS venue_facebook, v.website_url AS venue_website, v.phone AS venue_phone`
    : '';

  const sql = `SELECT e.*${venueCols}
    FROM events e
    LEFT JOIN venues v ON v.id = e.venue_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY e.is_featured DESC, e.start_datetime ASC
    LIMIT 200`;

  const rows = await db.all(sql, params);
  return NextResponse.json({ events: rows.map(normalizeRow) });
}

function normalizeRow(r) {
  if (r == null) return r;
  const out = { ...r };
  if (typeof out.is_featured === 'boolean') out.is_featured = out.is_featured ? 1 : 0;
  for (const k of ['start_datetime', 'end_datetime', 'created_at', 'expires_at']) {
    if (out[k] instanceof Date) out[k] = out[k].toISOString();
  }
  return out;
}
