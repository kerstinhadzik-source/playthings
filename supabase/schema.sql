-- PlayThings® Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the subscribers table

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  source VARCHAR(50) DEFAULT 'landing_page',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Create index on subscribed_at for date-based queries
CREATE INDEX IF NOT EXISTS idx_subscribers_subscribed_at ON subscribers(subscribed_at);

-- Create index on is_active for filtering active subscribers
CREATE INDEX IF NOT EXISTS idx_subscribers_is_active ON subscribers(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for newsletter signups)
CREATE POLICY "Allow anonymous inserts" ON subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Only authenticated users can read subscribers
CREATE POLICY "Authenticated users can read" ON subscribers
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only authenticated users can update
CREATE POLICY "Authenticated users can update" ON subscribers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON subscribers;
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE subscribers IS 'Email subscribers for PlayThings® newsletter';
COMMENT ON COLUMN subscribers.email IS 'Subscriber email address (unique)';
COMMENT ON COLUMN subscribers.source IS 'Where the subscription originated from';
COMMENT ON COLUMN subscribers.subscribed_at IS 'When the user subscribed';
COMMENT ON COLUMN subscribers.unsubscribed_at IS 'When the user unsubscribed (null if still active)';
COMMENT ON COLUMN subscribers.is_active IS 'Whether the subscription is currently active';
COMMENT ON COLUMN subscribers.metadata IS 'Additional data in JSON format';
