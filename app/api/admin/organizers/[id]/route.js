import { getDb } from '../../../../../lib/db';
import { verifyRequest, requireAdmin } from '../../../../../lib/supabaseServer';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Approve or reject an organizer application. */
export async function PATCH(req, { params }) {
  try {
    const auth = await verifyRequest(req);
    const gate = requireAdmin(auth);
    if (gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const body = await req.json();
    const action = String(body.action || '').toUpperCase(); // APPROVE | REJECT
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: "action must be 'APPROVE' or 'REJECT'" }, { status: 400 });
    }
    if (action === 'REJECT' && !body.rejection_reason) {
      return NextResponse.json({ error: 'rejection_reason required when rejecting' }, { status: 400 });
    }

    const db = getDb();
    const app = await db.get(`SELECT * FROM organizer_applications WHERE id = ?`, [params.id]);
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    if (action === 'APPROVE') {
      await db.run(
        `UPDATE organizer_applications
         SET status='APPROVED', rejection_reason=NULL, reviewed_at=NOW(), reviewed_by=?
         WHERE id = ?`,
        [auth.user.id, params.id]
      );
      // Ensure a profile row exists (older users may not have one), then promote to ORGANIZER.
      // Postgres UPSERT — creates or updates in one statement.
      if (db.kind === 'pg') {
        await db.run(
          `INSERT INTO profiles (id, role, business_name, city, instagram_handle, facebook_url, website_url, phone, updated_at)
           VALUES (?, 'ORGANIZER', ?, ?, ?, ?, ?, ?, NOW())
           ON CONFLICT (id) DO UPDATE SET
             role = 'ORGANIZER',
             business_name = EXCLUDED.business_name,
             city = EXCLUDED.city,
             instagram_handle = EXCLUDED.instagram_handle,
             facebook_url = EXCLUDED.facebook_url,
             website_url = EXCLUDED.website_url,
             phone = EXCLUDED.phone,
             updated_at = NOW()`,
          [app.user_id, app.business_name, app.city, app.instagram_handle, app.facebook_url,
           app.website_url, app.contact_phone]
        );
      } else {
        // SQLite equivalent
        await db.run(
          `INSERT OR REPLACE INTO profiles (id, role, business_name, city, instagram_handle, facebook_url, website_url, phone, updated_at)
           VALUES (?, 'ORGANIZER', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [app.user_id, app.business_name, app.city, app.instagram_handle, app.facebook_url,
           app.website_url, app.contact_phone]
        );
      }
    } else {
      await db.run(
        `UPDATE organizer_applications
         SET status='REJECTED', rejection_reason=?, reviewed_at=NOW(), reviewed_by=?
         WHERE id = ?`,
        [body.rejection_reason, auth.user.id, params.id]
      );
    }

    const updated = await db.get(`SELECT * FROM organizer_applications WHERE id = ?`, [params.id]);
    return NextResponse.json({ application: updated });
  } catch (err) {
    console.error('[api/admin/organizers/[id]] ERROR:', err);
    return NextResponse.json({ error: err?.message || String(err), code: err?.code || null }, { status: 500 });
  }
}
