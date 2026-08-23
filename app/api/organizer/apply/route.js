import { getDb } from '../../../../lib/db';
import { verifyRequest, requireAuth } from '../../../../lib/supabaseServer';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Submit an organizer application (any signed-in user). */
export async function POST(req) {
  try {
    const auth = await verifyRequest(req);
    const gate = requireAuth(auth);
    if (gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const body = await req.json();
    const err = validate(body);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const db = getDb();

    // Check if user already has an application
    const existing = await db.get(
      `SELECT id, status FROM organizer_applications WHERE user_id = ?`,
      [auth.user.id]
    );
    if (existing) {
      if (existing.status === 'PENDING') return NextResponse.json({ error: 'You already have a pending application.' }, { status: 400 });
      if (existing.status === 'APPROVED') return NextResponse.json({ error: 'You are already an approved organizer.' }, { status: 400 });
      // If REJECTED, allow re-application by updating
      await db.run(
        `UPDATE organizer_applications
         SET business_name=?, contact_name=?, contact_email=?, contact_phone=?, city=?,
             instagram_handle=?, facebook_url=?, website_url=?, message=?,
             status='PENDING', rejection_reason=NULL, created_at=NOW(), reviewed_at=NULL, reviewed_by=NULL
         WHERE user_id = ?`,
        [body.business_name, body.contact_name, body.contact_email, body.contact_phone || null,
         body.city, body.instagram_handle || null, body.facebook_url || null,
         body.website_url || null, body.message || null, auth.user.id]
      );
    } else {
      await db.run(
        `INSERT INTO organizer_applications
          (user_id, business_name, contact_name, contact_email, contact_phone, city,
           instagram_handle, facebook_url, website_url, message, status)
         VALUES (?,?,?,?,?,?,?,?,?,?, 'PENDING')`,
        [auth.user.id, body.business_name, body.contact_name, body.contact_email,
         body.contact_phone || null, body.city, body.instagram_handle || null,
         body.facebook_url || null, body.website_url || null, body.message || null]
      );
    }

    return NextResponse.json({ ok: true, status: 'PENDING' }, { status: 201 });
  } catch (err) {
    console.error('[api/organizer/apply] ERROR:', err);
    return NextResponse.json({ error: err?.message || String(err), code: err?.code || null }, { status: 500 });
  }
}

/** Get the current user's application (if any). */
export async function GET(req) {
  try {
    const auth = await verifyRequest(req);
    const gate = requireAuth(auth);
    if (gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const db = getDb();
    const app = await db.get(
      `SELECT id, business_name, contact_name, contact_email, contact_phone, city,
              instagram_handle, facebook_url, website_url, message, status,
              rejection_reason, created_at, reviewed_at
       FROM organizer_applications WHERE user_id = ?`,
      [auth.user.id]
    );
    return NextResponse.json({ application: app || null, role: auth.role });
  } catch (err) {
    console.error('[api/organizer/apply GET] ERROR:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

function validate(b) {
  if (!b) return 'Missing body';
  if (!b.business_name || b.business_name.length > 150) return 'Business name required (≤150 chars)';
  if (!b.contact_name || b.contact_name.length > 100) return 'Contact name required';
  if (!b.contact_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.contact_email)) return 'Valid contact email required';
  if (!b.city) return 'City required';
  return null;
}
