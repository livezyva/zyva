import { getDb } from '../../../../lib/db';
import { verifyRequest, requireAdmin } from '../../../../lib/supabaseServer';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** List organizer applications (?status=PENDING|APPROVED|REJECTED|ALL). */
export async function GET(req) {
  try {
    const auth = await verifyRequest(req);
    const gate = requireAdmin(auth);
    if (gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || 'PENDING').toUpperCase();

    const db = getDb();
    let sql = `SELECT * FROM organizer_applications`;
    const params = [];
    if (status !== 'ALL') { sql += ` WHERE status = ?`; params.push(status); }
    sql += ` ORDER BY created_at DESC LIMIT 500`;

    const rows = await db.all(sql, params);
    return NextResponse.json({ applications: rows });
  } catch (err) {
    console.error('[api/admin/organizers] ERROR:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
