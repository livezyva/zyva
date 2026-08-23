// ZYVA database adapter.
// - Local dev: better-sqlite3 (./data/zyva.db), auto-seeded.
// - Production: Postgres (Supabase/Neon) when DATABASE_URL is set.
//
// The rest of the app only calls db.all(sql, params) / db.get() / db.run(),
// so the two backends look identical.

const USE_PG = !!process.env.DATABASE_URL;

let _adapter;

function getDb() {
  if (_adapter) return _adapter;
  _adapter = USE_PG ? makePgAdapter() : makeSqliteAdapter();
  return _adapter;
}

/* ────────────────────────────── SQLite ────────────────────────────── */
function makeSqliteAdapter() {
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (err) {
    throw new Error(
      'better-sqlite3 is not installed (this is expected in serverless/production builds). ' +
      'Set DATABASE_URL in your environment to use Postgres/Supabase instead.'
    );
  }
  const path = require('path');
  const fs = require('fs');
  const DB_PATH = path.join(process.cwd(), 'data', 'zyva.db');
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSqliteSchema(db);
  ensureSeedSqlite(db);

  // Convert `?` (or named `@x`) style — we standardize on `?` in queries.
  return {
    kind: 'sqlite',
    all: (sql, params = []) => db.prepare(sql).all(...toPositional(params)),
    get: (sql, params = []) => db.prepare(sql).get(...toPositional(params)),
    run: (sql, params = []) => db.prepare(sql).run(...toPositional(params)),
  };
}

function toPositional(params) {
  if (Array.isArray(params)) return params;
  // Object => convert @named later; for now we only use arrays.
  return Object.values(params);
}

function initSqliteSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'CITIZEN',
      avatar_url TEXT,
      preferred_city TEXT DEFAULT 'Limassol',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      instagram_handle TEXT,
      facebook_url TEXT,
      website_url TEXT,
      phone TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      venue_id TEXT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      city TEXT NOT NULL,
      venue_name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      start_datetime TEXT NOT NULL,
      end_datetime TEXT NOT NULL,
      cover_image_url TEXT NOT NULL,
      gallery_urls TEXT,
      ticket_url TEXT,
      price_label TEXT DEFAULT 'Free Entry',
      status TEXT DEFAULT 'APPROVED_ACTIVE',
      is_featured INTEGER DEFAULT 0,
      listing_duration_days INTEGER DEFAULT 1,
      daily_rate_eur REAL DEFAULT 5.00,
      total_cost_eur REAL DEFAULT 5.00,
      rejection_reason TEXT,
      views_count INTEGER DEFAULT 0,
      shares_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
    CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
    CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
    CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime);
  `);
}

function ensureSeedSqlite(db) {
  const row = db.prepare('SELECT COUNT(*) AS n FROM events').get();
  if (row.n > 0) return;
  const { seedVenues, seedEvents } = require('./seedData');
  const iv = db.prepare(`INSERT INTO venues
    (id, name, slug, logo_url, city, address, latitude, longitude, instagram_handle, facebook_url, website_url, phone, is_verified)
    VALUES (@id, @name, @slug, @logo_url, @city, @address, @latitude, @longitude, @instagram_handle, @facebook_url, @website_url, @phone, @is_verified)`);
  const ie = db.prepare(`INSERT INTO events
    (id, venue_id, title, slug, description, category, city, venue_name, address, latitude, longitude,
      start_datetime, end_datetime, cover_image_url, gallery_urls, ticket_url, price_label, status, is_featured,
      listing_duration_days, daily_rate_eur, total_cost_eur, views_count, shares_count, expires_at)
    VALUES (@id, @venue_id, @title, @slug, @description, @category, @city, @venue_name, @address, @latitude, @longitude,
      @start_datetime, @end_datetime, @cover_image_url, @gallery_urls, @ticket_url, @price_label, @status, @is_featured,
      @listing_duration_days, @daily_rate_eur, @total_cost_eur, @views_count, @shares_count, @expires_at)`);
  const tx = db.transaction(() => {
    for (const v of seedVenues) iv.run(v);
    for (const e of seedEvents) ie.run(e);
  });
  tx();
}

/* ────────────────────────────── Postgres ────────────────────────────── */
function makePgAdapter() {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 5,
  });

  // Rewrite `?` placeholders to Postgres `$1, $2, ...`
  const toPg = (sql) => {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  };

  return {
    kind: 'pg',
    all: async (sql, params = []) => (await pool.query(toPg(sql), params)).rows,
    get: async (sql, params = []) => (await pool.query(toPg(sql), params)).rows[0] || null,
    run: async (sql, params = []) => (await pool.query(toPg(sql), params)).rowCount,
  };
}

module.exports = { getDb, USE_PG };
