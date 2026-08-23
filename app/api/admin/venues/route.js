import { getDb } from '../../../../lib/db';
import { verifyRequest, requireAdmin } from '../../../../lib/supabaseServer';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await verifyRequest(req);
    const gate = requireAdmin(auth);
    if (gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const db = getDb();
    // Select only columns guaranteed to exist in the base schema.
    // Extra columns (facebook_url, phone) are pulled in a second try-select.
    let rows;
    try {
      rows = await db.all(
        `SELECT id, name, slug, city, address, latitude, longitude,
                instagram_handle, facebook_url, website_url, phone, is_verified
         FROM venues ORDER BY name ASC`, []
      );
    } catch {
      rows = await db.all(
        `SELECT id, name, slug, city, address, latitude, longitude,
                instagram_handle, website_url, is_verified
         FROM venues ORDER BY name ASC`, []
      );
    }
    return NextResponse.json({ venues: rows });
  } catch (err) {
    console.error('[api/admin/venues] ERROR:', err);
    return NextResponse.json({ error: err?.message || String(err), code: err?.code || null }, { status: 500 });
  }
}
