import { getDb } from '../../../../lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const { slug } = await params;
  const db = getDb();
  const event = await db.get('SELECT * FROM events WHERE slug = ?', [slug]);
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await db.run('UPDATE events SET views_count = views_count + 1 WHERE id = ?', [event.id]);
  const venue = await db.get('SELECT * FROM venues WHERE id = ?', [event.venue_id]);
  const related = await db.all(
    "SELECT id, slug, title, start_datetime, end_datetime, cover_image_url, category, price_label, city, venue_name, is_featured, views_count FROM events WHERE venue_id = ? AND id != ? AND status = 'APPROVED_ACTIVE' AND end_datetime >= ? ORDER BY start_datetime ASC LIMIT 4",
    [event.venue_id, event.id, new Date().toISOString()]
  );
  return NextResponse.json({ event, venue, related });
}
