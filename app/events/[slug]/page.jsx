import { getDb } from '../../../lib/db';
import { publicEventSelect, publicVenueSelect } from '../../../lib/publicData';
import { notFound } from 'next/navigation';
import Header from '../../../components/Header';
import EventDetailClient from './EventDetailClient';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const db = getDb();
  const e = await db.get(
    "SELECT title, description, cover_image_url FROM events WHERE slug = ? AND status = 'APPROVED_ACTIVE'",
    [slug]
  );
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
  const event = await db.get(
    `SELECT ${publicEventSelect('e')} FROM events e WHERE e.slug = ? AND e.status = 'APPROVED_ACTIVE'`,
    [slug]
  );
  if (!event) notFound();
  const venue = event.venue_id
    ? await db.get(`SELECT ${publicVenueSelect('v')} FROM venues v WHERE v.id = ?`, [event.venue_id])
    : null;
  const related = await db.all(
    "SELECT id, slug, title, start_datetime, end_datetime, cover_image_url, category, price_label, city, venue_name, is_featured, views_count FROM events WHERE venue_id = ? AND id != ? AND status = 'APPROVED_ACTIVE' AND end_datetime >= ? ORDER BY start_datetime ASC LIMIT 4",
    [event.venue_id, event.id, new Date().toISOString()]
  );

  // Normalize Postgres dates/booleans before passing data into client components.
  const norm = (r) => {
    if (!r) return r;
    const out = { ...r };
    if (typeof out.is_featured === 'boolean') out.is_featured = out.is_featured ? 1 : 0;
    if (typeof out.is_verified === 'boolean') out.is_verified = out.is_verified ? 1 : 0;
    for (const k of ['start_datetime', 'end_datetime']) {
      if (out[k] instanceof Date) out[k] = out[k].toISOString();
    }
    return out;
  };

  return (
    <div className="min-h-screen bg-zbg">
      <Header />
      <EventDetailClient event={norm(event)} venue={norm(venue)} related={related.map(norm)} />
    </div>
  );
}
