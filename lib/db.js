// ZYVA database adapter.
// - Local dev: better-sqlite3 (./data/zyva.db), auto-seeded.
// - Production: Postgres (Supabase/Neon) when DATABASE_URL is set.
//
// The rest of the app only calls db.all(sql, params) / db.get() / db.run(),
// so the two backends look identical.

const USE_PG = !!process.env.DATABASE_URL || process.env.CLOUDFLARE_BUILD === '1';

let _adapter;

/**
 * Read Cloudflare's request context from the symbol initialized by the
 * OpenNext Worker wrapper. Outside Cloudflare (local development / Netlify),
 * this safely returns null without importing Cloudflare's build-time package.
 */
function getHyperdriveConnectionString() {
  try {
    const context = globalThis[Symbol.for('__cloudflare-context__')];
    return context?.env?.HYPERDRIVE?.connectionString || null;
  } catch {
    return null;
  }
}

function getDb() {
  const hyperdriveUrl = getHyperdriveConnectionString();

  // Worker I/O objects must never be reused across requests. Return a fresh
  // lightweight adapter; Hyperdrive owns and reuses the underlying pool.
  if (hyperdriveUrl) return makePgAdapter(hyperdriveUrl, { hyperdrive: true });

  // Node runtimes (Netlify and local development) can safely cache the adapter.
  if (_adapter) return _adapter;
  _adapter = process.env.DATABASE_URL
    ? makePgAdapter(process.env.DATABASE_URL)
    : makeSqliteAdapter();
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
      description_el TEXT,
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
  const eventColumns = db.prepare('PRAGMA table_info(events)').all().map(column => column.name);
  if (!eventColumns.includes('description_el')) {
    db.exec('ALTER TABLE events ADD COLUMN description_el TEXT');
  }
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
function makePgAdapter(connectionString, { hyperdrive = false } = {}) {
  const { Pool, Client } = require('pg');

  // Rewrite `?` placeholders to Postgres `$1, $2, ...`
  const toPg = (sql) => {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  };

  if (hyperdrive) {
    // Cloudflare requires request-scoped database clients. Hyperdrive performs
    // the actual global connection pooling behind this generated URL.
    const query = async (sql, params = []) => {
      const client = new Client({ connectionString });
      let connected = false;
      try {
        await client.connect();
        connected = true;
        return await client.query(toPg(sql), params);
      } finally {
        if (connected) await client.end().catch(() => {});
      }
    };

    return {
      kind: 'pg',
      all: async (sql, params = []) => (await query(sql, params)).rows,
      get: async (sql, params = []) => (await query(sql, params)).rows[0] || null,
      run: async (sql, params = []) => (await query(sql, params)).rowCount,
    };
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 5,
  });

  return {
    kind: 'pg',
    all: async (sql, params = []) => (await pool.query(toPg(sql), params)).rows,
    get: async (sql, params = []) => (await pool.query(toPg(sql), params)).rows[0] || null,
    run: async (sql, params = []) => (await pool.query(toPg(sql), params)).rowCount,
  };
}

module.exports = { getDb, USE_PG };
