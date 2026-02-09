-- ═══════════════════════════════════════════════════════════
-- CRM Tables — Contacts & Activities
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. CRM Contacts
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
CREATE POLICY "Authenticated full access on crm_contacts" ON crm_contacts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon access (needed until auth is wired to CRM)
CREATE POLICY "Anon access on crm_contacts" ON crm_contacts
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);


-- 2. CRM Activities
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
CREATE POLICY "Authenticated full access on crm_activities" ON crm_activities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon access (needed until auth is wired to CRM)
CREATE POLICY "Anon access on crm_activities" ON crm_activities
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);


-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_contacts_stage ON crm_contacts(stage);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_created ON crm_contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_timestamp ON crm_activities(timestamp);
