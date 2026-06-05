-- ============================================================
-- MEDCYCLE — Reports / Flag System Migration
-- Run this entire script in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

-- ************************************************************
-- 1. REPORTS TABLE
-- ************************************************************

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'fraudulent', 'expired', 'duplicate', 'other')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent a user from reporting the same listing more than once
  UNIQUE(listing_id, reporter_id)
);

-- Foreign key to profiles so PostgREST can join the reporter's profile info
ALTER TABLE public.reports
ADD CONSTRAINT reports_reporter_id_profiles_fkey
FOREIGN KEY (reporter_id) REFERENCES public.profiles(user_id);

-- ************************************************************
-- 2. INDEXES
-- ************************************************************

CREATE INDEX IF NOT EXISTS idx_reports_listing_id  ON public.reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at  ON public.reports(created_at DESC);

-- ************************************************************
-- 3. ROW LEVEL SECURITY
-- ************************************************************

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can submit a report (only as themselves)
CREATE POLICY "reports_insert_own"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Reporter can see their own reports; admins see all
CREATE POLICY "reports_select"
  ON public.reports FOR SELECT
  USING (
    auth.uid() = reporter_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Only admins can delete (dismiss) reports
CREATE POLICY "reports_delete_admin"
  ON public.reports FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );
