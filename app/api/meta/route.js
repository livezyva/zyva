import { getDb } from '../../../lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const nowIso = new Date().toISOString();

    const cities = (await db.all(
      "SELECT DISTINCT city FROM events WHERE status='APPROVED_ACTIVE' ORDER BY city",
      []
    )).map(r => r.city);

    const categories = (await db.all(
      "SELECT DISTINCT category FROM events WHERE status='APPROVED_ACTIVE' ORDER BY category",
      []
    )).map(r => r.category);

    // is_featured differs by database:
    //   Postgres → boolean (compare with TRUE)
    //   SQLite   → integer 0/1 (compare with 1)
    const featuredExpr = db.kind === 'pg'
      ? 'CASE WHEN is_featured IS TRUE THEN 1 ELSE 0 END'
      : 'CASE WHEN is_featured = 1 THEN 1 ELSE 0 END';

    const counts = await db.get(
      `SELECT COUNT(*) AS total, COALESCE(SUM(${featuredExpr}), 0) AS featured
       FROM events
       WHERE status='APPROVED_ACTIVE' AND end_datetime >= ?`,
      [nowIso]
    );

    return NextResponse.json({ cities, categories, counts });
  } catch (err) {
    console.error('[api/meta] ERROR:', err);
    return NextResponse.json(
      { error: err?.message || String(err), code: err?.code || null },
      { status: 500 }
    );
  }
}
