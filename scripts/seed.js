#!/usr/bin/env node
// Seed either the local SQLite DB or a remote Postgres (Supabase) DB
// with the same Cyprus demo data.
//
// Usage:
//   node scripts/seed.js                       # seeds ./data/zyva.db
//   DATABASE_URL=postgres://... node scripts/seed.js
//   DATABASE_URL=... node scripts/seed.js --reset   # wipes & re-seeds

// Optionally load .env.local if dotenv is installed (not required — you can
// also pass DATABASE_URL inline: DATABASE_URL='...' npm run seed)
try { require('dotenv').config({ path: '.env.local' }); } catch {}
const { seedVenues, seedEvents } = require('../lib/seedData');

const USE_PG = !!process.env.DATABASE_URL;
const RESET = process.argv.includes('--reset');

async function main() {
  if (USE_PG) return seedPg();
  return seedSqlite();
}

function seedSqlite() {
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs = require('fs');
  const DB_PATH = path.join(process.cwd(), 'data', 'zyva.db');
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  if (RESET) {
    db.exec('DROP TABLE IF EXISTS events; DROP TABLE IF EXISTS venues; DROP TABLE IF EXISTS saved_events; DROP TABLE IF EXISTS payments; DROP TABLE IF EXISTS users;');
  }
  // schema will be created on next server boot via lib/db.js
  console.log('SQLite ready at', DB_PATH, '— schema + seed will run when the app starts.');
}

async function seedPg() {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  console.log('→ Connecting to Postgres…');
  const client = await pool.connect();
  try {
    if (RESET) {
      console.log('→ Resetting tables (--reset)');
      await client.query('TRUNCATE payments, saved_events, events, venues RESTART IDENTITY CASCADE');
    }

    const { rows: existing } = await client.query('SELECT COUNT(*)::int AS n FROM events');
    if (existing[0].n > 0 && !RESET) {
      console.log(`✓ Already seeded (${existing[0].n} events). Pass --reset to wipe.`);
      return;
    }

    console.log(`→ Inserting ${seedVenues.length} venues…`);
    for (const v of seedVenues) {
      await client.query(
        `INSERT INTO venues (id, name, slug, logo_url, city, address, latitude, longitude, instagram_handle, facebook_url, website_url, phone, is_verified)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (slug) DO NOTHING`,
        [v.id, v.name, v.slug, v.logo_url, v.city, v.address, v.latitude, v.longitude, v.instagram_handle, v.facebook_url, v.website_url, v.phone, !!v.is_verified]
      );
    }

    console.log(`→ Inserting ${seedEvents.length} events…`);
    for (const e of seedEvents) {
      await client.query(
        `INSERT INTO events
          (id, venue_id, title, slug, description, category, city, venue_name, address, latitude, longitude,
           start_datetime, end_datetime, cover_image_url, gallery_urls, ticket_url, price_label, status, is_featured,
           listing_duration_days, daily_rate_eur, total_cost_eur, views_count, shares_count, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
         ON CONFLICT (slug) DO NOTHING`,
        [
          e.id, e.venue_id, e.title, e.slug, e.description, e.category, e.city, e.venue_name, e.address,
          e.latitude, e.longitude, e.start_datetime, e.end_datetime, e.cover_image_url, e.gallery_urls,
          e.ticket_url, e.price_label, e.status, !!e.is_featured, e.listing_duration_days, e.daily_rate_eur,
          e.total_cost_eur, e.views_count, e.shares_count, e.expires_at,
        ]
      );
    }

    console.log('✓ Seed complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
