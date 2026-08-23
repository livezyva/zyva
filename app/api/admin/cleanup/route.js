import { getDb } from '../../../../lib/db';
import { verifyRequest, requireAdmin } from '../../../../lib/supabaseServer';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RETENTION_DAYS = 7;

/**
 * Manually trigger the same cleanup the nightly cron does.
 * Admin-only. Great for testing without waiting until 4am.
 */
export async function POST(req) {
  try {
    const auth = await verifyRequest(req);
    const gate = requireAdmin(auth);
    if (gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const db = getDb();
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Preview
    const preview = await db.all(
      `SELECT id, title, end_datetime FROM events WHERE end_datetime < ? LIMIT 100`,
      [cutoff]
    );

    // Delete
    await db.run(`DELETE FROM events WHERE end_datetime < ?`, [cutoff]);

    return NextResponse.json({
      ok: true,
      deleted: preview.length,
      retention_days: RETENTION_DAYS,
      ran_at: new Date().toISOString(),
      deleted_events: preview.map(r => ({
        id: r.id,
        title: r.title,
        ended: r.end_datetime,
      })),
    });
  } catch (err) {
    console.error('[api/admin/cleanup] ERROR:', err);
    return NextResponse.json(
      { error: err?.message || String(err), code: err?.code || null },
      { status: 500 }
    );
  }
}
