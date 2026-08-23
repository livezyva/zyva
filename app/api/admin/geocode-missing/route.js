// Admin endpoint: find events without lat/lng and try to geocode them.
// Also updates the linked venue if it exists.
import { getDb } from '../../../../lib/db';
import { verifyRequest, requireAdmin } from '../../../../lib/supabaseServer';
import { geocodeAddress } from '../../../../lib/geocode';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Netlify allows this on some tiers

export async function POST(req) {
  try {
    const auth = await verifyRequest(req);
    const gate = requireAdmin(auth);
    if (gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const db = getDb();

    // Find all events missing coords
    const rows = await db.all(
      `SELECT id, venue_id, title, city, address FROM events
       WHERE (latitude IS NULL OR longitude IS NULL) AND address IS NOT NULL
       LIMIT 25`, // stay well under Netlify's serverless timeout
      []
    );

    const results = [];
    for (const r of rows) {
      const geo = await geocodeAddress(r.address, r.city);
      if (geo) {
        await db.run(
          `UPDATE events SET latitude = ?, longitude = ? WHERE id = ?`,
          [geo.lat, geo.lng, r.id]
        );
        if (r.venue_id) {
          await db.run(
            `UPDATE venues SET latitude = ?, longitude = ?
             WHERE id = ? AND (latitude IS NULL OR longitude IS NULL)`,
            [geo.lat, geo.lng, r.venue_id]
          );
        }
        results.push({ id: r.id, title: r.title, status: 'ok', lat: geo.lat, lng: geo.lng });
      } else {
        results.push({ id: r.id, title: r.title, status: 'not_found', address: r.address });
      }
      // Nominatim ToS: max 1 req/sec
      await new Promise(res => setTimeout(res, 1100));
    }

    return NextResponse.json({
      ok: true,
      scanned: rows.length,
      geocoded: results.filter(r => r.status === 'ok').length,
      not_found: results.filter(r => r.status === 'not_found').length,
      results,
    });
  } catch (err) {
    console.error('[api/admin/geocode-missing] ERROR:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
