import { getDb } from '../../../lib/db';
import { notFound } from 'next/navigation';
import Header from '../../../components/Header';
import EventDetailClient from './EventDetailClient';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const db = getDb();
  const e = await db.get('SELECT * FROM events WHERE slug = ?', [slug]);
  if (!e) return {};
  return {
    title: `${e.title} — ZYVA`,
    description: (e.description || '').slice(0, 160),
    openGraph: {
      title: e.title,
      description: (e.description || '').slice(0, 200),
      images: [{ url: e.cover_image_url }],
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title: e.title, images: [e.cover_image_url] },
  };
}

export default async function EventDetailPage({ params }) {
  const { slug } = await params;
  const db = getDb();
  const event = await db.get('SELECT * FROM events WHERE slug = ?', [slug]);
  if (!event) notFound();
  const venue = await db.get('SELECT * FROM venues WHERE id = ?', [event.venue_id]);
  const related = await db.all(
    "SELECT id, slug, title, start_datetime, end_datetime, cover_image_url, category, price_label, city, venue_name, is_featured, views_count FROM events WHERE venue_id = ? AND id != ? AND status = 'APPROVED_ACTIVE' AND end_datetime >= ? ORDER BY start_datetime ASC LIMIT 4",
    [event.venue_id, event.id, new Date().toISOString()]
  );

  // Normalize (Postgres returns Date/boolean; SQLite returns strings/0-1)
  const norm = (r) => {
    if (!r) return r;
    const out = { ...r };
    if (typeof out.is_featured === 'boolean') out.is_featured = out.is_featured ? 1 : 0;
    for (const k of ['start_datetime', 'end_datetime', 'created_at', 'expires_at']) {
      if (out[k] instanceof Date) out[k] = out[k].toISOString();
    }
    return out;
  };

  return (
    <div className="min-h-screen bg-zbg">
      <Header />
      <EventDetailClient event={norm(event)} venue={venue} related={related.map(norm)} />
    </div>
  );
}
