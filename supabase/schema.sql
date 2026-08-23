-- ZYVA v1.0 — Postgres schema for Supabase / Neon
-- Run this in Supabase's SQL editor (or `psql $DATABASE_URL -f supabase/schema.sql`).

-- Enable UUID generator (built-in on Postgres 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS & ROLES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CITIZEN', 'ORGANIZER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    role user_role DEFAULT 'CITIZEN',
    avatar_url TEXT,
    preferred_city VARCHAR(50) DEFAULT 'Limassol',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. VENUES
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    logo_url TEXT,
    city VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    instagram_handle VARCHAR(100),
    facebook_url TEXT,
    website_url TEXT,
    phone VARCHAR(30),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. EVENTS
DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'PAYMENT_PENDING', 'APPROVED_ACTIVE', 'REJECTED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    venue_name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    cover_image_url TEXT NOT NULL,
    gallery_urls TEXT,
    ticket_url TEXT,
    price_label VARCHAR(50) DEFAULT 'Free Entry',
    status event_status DEFAULT 'PENDING_APPROVAL',
    is_featured BOOLEAN DEFAULT FALSE,
    listing_duration_days INT DEFAULT 1,
    daily_rate_eur DECIMAL(10, 2) DEFAULT 5.00,
    total_cost_eur DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    rejection_reason TEXT,
    views_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

-- 4. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_checkout_session_id VARCHAR(255) UNIQUE,
    amount_eur DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. SAVED / BOOKMARKED EVENTS
CREATE TABLE IF NOT EXISTS saved_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_events_end ON events(end_datetime);

-- Optional: PostGIS geo index for advanced spatial queries.
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS geom geography(Point, 4326)
--   GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED;
-- CREATE INDEX IF NOT EXISTS idx_events_geom ON events USING GIST (geom);
