import { getDb } from '../../../../../lib/db';
import { verifyRequest, requireAdmin } from '../../../../../lib/supabaseServer';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function safe(handler) {
  try { return await handler(); }
  catch (err) {
    console.error('[api/admin/events/[id]] ERROR:', err);
    return NextResponse.json(
      { error: err?.message || String(err), code: err?.code || null },
      { status: 500 }
    );
  }
}

const EDITABLE = new Set([
  'title', 'description', 'category', 'city', 'venue_name', 'address',
  'latitude', 'longitude', 'start_datetime', 'end_datetime',
  'cover_image_url', 'ticket_url', 'price_label', 'status', 'is_featured',
  'venue_id', 'contact_name', 'contact_email', 'contact_phone',
  'rejection_reason',
]);

export async function PATCH(req, { params }) {
  return safe(async () => {
    const { id } = await params;
    const auth = await verifyRequest(req);
    const gate = requireAdmin(auth);
    if (gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const db = getDb();
    const body = await req.json();
    const sets = [], vals = [];
    for (const [k, v] of Object.entries(body)) {
      if (!EDITABLE.has(k)) continue;
      sets.push(`${k} = ?`);
      if (k === 'is_featured') {
        vals.push(db.kind === 'pg' ? !!v : (v ? 1 : 0));
      } else {
        vals.push(v);
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
    vals.push(id);
    await db.run(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`, vals);
    const row = await db.get(`SELECT * FROM events WHERE id = ?`, [id]);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (typeof row.is_featured === 'boolean') row.is_featured = row.is_featured ? 1 : 0;
    return NextResponse.json({ event: row });
  });
}

export async function DELETE(req, { params }) {
  return safe(async () => {
    const { id } = await params;
    const auth = await verifyRequest(req);
    const gate = requireAdmin(auth);
    if (gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const db = getDb();
    await db.run(`DELETE FROM events WHERE id = ?`, [id]);
    return NextResponse.json({ ok: true });
  });
}
