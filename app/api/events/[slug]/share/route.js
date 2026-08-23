import { getDb } from '../../../../../lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(_req, { params }) {
  const db = getDb();
  await db.run('UPDATE events SET shares_count = shares_count + 1 WHERE slug = ?', [params.slug]);
  return NextResponse.json({ ok: true });
}
