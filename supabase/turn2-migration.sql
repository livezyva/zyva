-- ZYVA Turn 2 migration — organizer flow tables
-- Run this in Supabase SQL Editor once.
-- Safe to re-run (uses IF NOT EXISTS everywhere).

-- 1. Profiles table (tracks user roles: CITIZEN | ORGANIZER | ADMIN)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'CITIZEN',
  full_name VARCHAR(100),
  business_name VARCHAR(150),
  city VARCHAR(50),
  instagram_handle VARCHAR(100),
  facebook_url TEXT,
  website_url TEXT,
  phone VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Organizer applications table
CREATE TABLE IF NOT EXISTS organizer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(150) NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(30),
  city VARCHAR(50) NOT NULL,
  instagram_handle VARCHAR(100),
  facebook_url TEXT,
  website_url TEXT,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_organizer_applications_status ON organizer_applications(status);

-- 3. Extend events: track who submitted and organizer link
ALTER TABLE events ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Permissions (RLS is off; server routes handle auth)
GRANT ALL ON TABLE profiles TO anon, authenticated;
GRANT ALL ON TABLE organizer_applications TO anon, authenticated;
