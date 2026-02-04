-- Add unsubscribed_at (and any other missing columns) if subscribers already existed
-- Run this in Supabase SQL Editor if you get "column unsubscribed_at does not exist"

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscribers' AND column_name = 'unsubscribed_at'
  ) THEN
    ALTER TABLE public.subscribers ADD COLUMN unsubscribed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscribers' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.subscribers ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscribers' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.subscribers ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;
