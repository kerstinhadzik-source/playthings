-- ═══════════════════════════════════════════════════════════
-- playthings — Supabase Schema Setup
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- 1. Email subscribers (landing page signups)
CREATE TABLE IF NOT EXISTS subscribers (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  source     TEXT DEFAULT 'landing_page',
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public signup form)
CREATE POLICY "Allow anonymous inserts" ON subscribers
  FOR INSERT WITH CHECK (true);

-- Allow authenticated reads
CREATE POLICY "Allow authenticated reads" ON subscribers
  FOR SELECT USING (auth.role() = 'authenticated');


-- 2. CRM Contacts
CREATE TABLE IF NOT EXISTS crm_contacts (
  id            TEXT PRIMARY KEY,
  shop_name     TEXT NOT NULL DEFAULT '',
  contact_name  TEXT DEFAULT '',
  email         TEXT DEFAULT '',
  phone         TEXT DEFAULT '',
  city          TEXT DEFAULT '',
  source        TEXT DEFAULT 'website',
  stage         TEXT DEFAULT 'lead',
  tier          TEXT DEFAULT '',
  followup      TEXT DEFAULT '',
  notes         JSONB DEFAULT '[]'::JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_contact  TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Authenticated full access" ON crm_contacts
  FOR ALL USING (auth.role() = 'authenticated');

-- Also allow anon access during development (remove in production)
CREATE POLICY "Anon access (dev)" ON crm_contacts
  FOR ALL USING (true);


-- 3. CRM Activities
CREATE TABLE IF NOT EXISTS crm_activities (
  id          TEXT PRIMARY KEY,
  contact_id  TEXT REFERENCES crm_contacts(id) ON DELETE CASCADE,
  text        TEXT DEFAULT '',
  type        TEXT DEFAULT '',
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Authenticated full access" ON crm_activities
  FOR ALL USING (auth.role() = 'authenticated');

-- Also allow anon access during development (remove in production)
CREATE POLICY "Anon access (dev)" ON crm_activities
  FOR ALL USING (true);


-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_contacts_stage ON crm_contacts(stage);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_created ON crm_contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_timestamp ON crm_activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
