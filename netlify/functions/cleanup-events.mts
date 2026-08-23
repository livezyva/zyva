// Scheduled function: deletes events that ended more than 7 days ago.
// Runs daily at 02:00 UTC (05:00 EEST / 04:00 EET Cyprus time).
//
// Netlify Scheduled Functions docs:
// https://docs.netlify.com/functions/scheduled-functions/

import type { Config } from '@netlify/functions';
import { Pool } from 'pg';

const RETENTION_DAYS = 7;

export default async (_req: Request) => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[cleanup-events] DATABASE_URL not set');
    return new Response(JSON.stringify({ error: 'DATABASE_URL not set' }), { status: 500 });
  }

  const pool = new Pool({
    connectionString: url,
    ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 1,
  });

  try {
    // Show what we're about to nuke (for the Netlify logs)
    const preview = await pool.query(
      `SELECT id, title, end_datetime
       FROM events
       WHERE end_datetime < NOW() - INTERVAL '${RETENTION_DAYS} days'
       LIMIT 100`
    );
    console.log(`[cleanup-events] Found ${preview.rowCount} event(s) to delete`);
    for (const row of preview.rows) {
      console.log(`  - ${row.id} | ended ${row.end_datetime} | "${row.title}"`);
    }

    // Actually delete
    const result = await pool.query(
      `DELETE FROM events
       WHERE end_datetime < NOW() - INTERVAL '${RETENTION_DAYS} days'`
    );

    console.log(`[cleanup-events] Deleted ${result.rowCount} event(s)`);

    return new Response(
      JSON.stringify({
        ok: true,
        deleted: result.rowCount,
        retention_days: RETENTION_DAYS,
        ran_at: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[cleanup-events] ERROR:', err);
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await pool.end();
  }
};

export const config: Config = {
  // Run every day at 02:00 UTC (04:00 Cyprus EET / 05:00 EEST — always quiet hours)
  schedule: '0 2 * * *',
};
