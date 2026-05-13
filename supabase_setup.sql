-- ============================================================
-- MEDCYCLE — Complete Supabase Setup
-- Run this ENTIRE script in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================


-- ************************************************************
-- 1. TABLES
-- ************************************************************

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  organization_name TEXT NOT NULL DEFAULT '',
  contact_person TEXT NOT NULL DEFAULT '',
  phone_number TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  license_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('medication', 'equipment', 'supply')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'taken')),
  is_approved BOOLEAN DEFAULT FALSE,
  -- Medication-specific fields
  generic_name TEXT,
  trade_name TEXT,
  expiry_date DATE,
  -- Equipment-specific fields
  condition TEXT CHECK (condition IN ('new', 'used', 'needs_repair') OR condition IS NULL),
  -- Supply-specific fields
  quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key so PostgREST can join listings → profiles
ALTER TABLE public.listings
ADD CONSTRAINT listings_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);


-- ************************************************************
-- 2. INDEXES (for fast queries)
-- ************************************************************

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_is_approved ON public.listings(is_approved);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);


-- ************************************************************
-- 3. ROW LEVEL SECURITY (RLS) — PROFILES
-- ************************************************************

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles (needed to show contact info on listings)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can create their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update ANY profile (for role assignment)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );


-- ************************************************************
-- 4. ROW LEVEL SECURITY (RLS) — LISTINGS
-- ************************************************************

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Public can only view APPROVED listings; owners see their own; admins see all
CREATE POLICY "listings_select_approved"
  ON public.listings FOR SELECT
  USING (
    is_approved = true
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Authenticated users can create listings (only for themselves)
CREATE POLICY "listings_insert_own"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
CREATE POLICY "listings_update_own"
  ON public.listings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "listings_delete_own"
  ON public.listings FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can update ANY listing (for approving)
CREATE POLICY "listings_update_admin"
  ON public.listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can delete ANY listing
CREATE POLICY "listings_delete_admin"
  ON public.listings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );


-- ************************************************************
-- 5. STORAGE BUCKETS
-- ************************************************************

-- Create the "listing-images" bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create the "licenses" bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('licenses', 'licenses', true)
ON CONFLICT (id) DO NOTHING;


-- ************************************************************
-- 6. STORAGE POLICIES — listing-images bucket
-- ************************************************************

-- Anyone can VIEW listing images
CREATE POLICY "listing_images_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

-- Authenticated users can UPLOAD listing images
CREATE POLICY "listing_images_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.role() = 'authenticated'
  );

-- Users can UPDATE their own listing images
CREATE POLICY "listing_images_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can DELETE their own listing images
CREATE POLICY "listing_images_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ************************************************************
-- 7. STORAGE POLICIES — licenses bucket
-- ************************************************************

-- Anyone can VIEW license files
CREATE POLICY "licenses_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'licenses');

-- Authenticated users can UPLOAD license files
CREATE POLICY "licenses_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'licenses'
    AND auth.role() = 'authenticated'
  );

-- Users can UPDATE their own license files
CREATE POLICY "licenses_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'licenses'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can DELETE their own license files
CREATE POLICY "licenses_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'licenses'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ************************************************************
-- 8. HELPER: Auto-create profile on signup (optional trigger)
-- ************************************************************

-- This function auto-creates an empty profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fires after a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ************************************************************
-- 9. MAKING A USER AN ADMIN
-- ************************************************************
-- After a user signs up, find their user_id in the profiles table
-- and run this command to make them an admin:
--
--   UPDATE public.profiles
--   SET is_admin = true
--   WHERE user_id = 'PASTE_THE_USER_UUID_HERE';
--
-- You can find user UUIDs in:
--   Dashboard → Authentication → Users
-- ************************************************************


-- ************************************************************
-- 10. AUTO-DELETE EXPIRED LISTINGS
-- ************************************************************

-- Enable the pg_cron extension (available on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: delete listings where expiry_date has passed
CREATE OR REPLACE FUNCTION public.delete_expired_listings()
RETURNS void AS $$
BEGIN
  DELETE FROM public.listings
  WHERE expiry_date IS NOT NULL
  AND expiry_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: run every day at midnight UTC
SELECT cron.schedule(
  'delete-expired-listings',
  '0 0 * * *',
  'SELECT public.delete_expired_listings()'
);
