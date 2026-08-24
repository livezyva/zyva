import { getDb } from '../../../../lib/db';
import { publicVenueSelect } from '../../../../lib/publicData';
import { verifyRequest, requireOrganizer } from '../../../../lib/supabaseServer';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Venues an approved organizer may use without exposing owner/user IDs. */
export async function GET(req) {
  try {
    const auth = await verifyRequest(req);
    const gate = requireOrganizer(auth);
    if (gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const db = getDb();
    const verified = db.kind === 'pg' ? 'v.is_verified IS TRUE' : 'v.is_verified = 1';
    const rows = await db.all(
      `SELECT ${publicVenueSelect('v')}
       FROM venues v
       WHERE ${verified}
          OR EXISTS (
            SELECT 1 FROM events own_event
            WHERE own_event.venue_id = v.id AND own_event.submitted_by = ?
          )
       ORDER BY v.name ASC`,
      [auth.user.id]
    );
    return NextResponse.json({ venues: rows.map(normalize) });
  } catch (err) {
    console.error('[api/organizer/venues GET] ERROR:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

function normalize(row) {
  if (!row) return row;
  const out = { ...row };
  if (typeof out.is_verified === 'boolean') out.is_verified = out.is_verified ? 1 : 0;
  return out;
}
