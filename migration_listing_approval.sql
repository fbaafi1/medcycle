-- ============================================================
-- MEDCYCLE — Migration: Listing Approval System
-- Run this in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

-- 1. Add is_approved column to listings (defaults to false = pending)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- 2. Approve all EXISTING listings (so current data isn't hidden)
UPDATE public.listings SET is_approved = true WHERE is_approved IS NULL OR is_approved = false;

-- 3. Drop the old "anyone can view all listings" policy
DROP POLICY IF EXISTS "listings_select_all" ON public.listings;

-- 4. Public can only see APPROVED listings
CREATE POLICY "listings_select_approved"
  ON public.listings FOR SELECT
  USING (
    is_approved = true
    OR auth.uid() = user_id   -- owners can always see their own
    OR EXISTS (                -- admins can see all
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 5. Allow admins to UPDATE any listing (for approving)
CREATE POLICY "listings_update_admin"
  ON public.listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 6. Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_listings_is_approved ON public.listings(is_approved);

-- ============================================================
-- Done! Listing approval system is now active.
-- New listings will default to is_approved = false (pending).
-- Admin must approve them before they appear on the marketplace.
-- ============================================================
