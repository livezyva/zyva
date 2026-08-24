import { getDb } from '../../../../../lib/db';
import { verifyRequest, requireAdmin } from '../../../../../lib/supabaseServer';
import { NextResponse } from 'next/server';
import { translateDescriptionToGreek } from '../../../../../lib/translate';

export const dynamic = 'force-dynamic';

async function safe(handler) {
  try { return await handler(); }
  catch (err) {
    console.error('[api/admin/events/[id]] ERROR:', err);
    const status = err?.code === 'TRANSLATION_NOT_CONFIGURED' ? 409
      : err?.code?.startsWith?.('TRANSLATION_') ? 502
        : 500;
    return NextResponse.json(
      { error: err?.message || String(err), code: err?.code || null },
      { status }
    );
  }
}

const EDITABLE = new Set([
  'title', 'description', 'description_el', 'category', 'city', 'venue_name', 'address',
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
    const existing = await db.get(`SELECT * FROM events WHERE id = ?`, [id]);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Generate a missing Greek description once, at admin approval—not on page views.
    if (body.status === 'APPROVED_ACTIVE') {
      const englishDescription = body.description ?? existing.description;
      const greekDescription = body.description_el ?? existing.description_el;
      if (!String(greekDescription || '').trim()) {
        body.description_el = await translateDescriptionToGreek(englishDescription);
      }
    }

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
