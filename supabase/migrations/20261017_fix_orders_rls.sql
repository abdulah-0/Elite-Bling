-- ============================================================
-- Fix: Row Level Security (RLS) policies for table "orders"
-- Resolves: "new row violates row-level security policy for table orders"
-- Reference: docs/implementation.prd.md §7.6
-- ============================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing / conflicting policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view guest orders" ON public.orders;
DROP POLICY IF EXISTS "Users and guests can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- 1. Allow anyone (both authenticated customers and anonymous guests) to insert orders
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  TO public
  WITH CHECK (true);

-- 2. Allow customers to SELECT their own orders, and guests to select guest orders (user_id IS NULL)
-- This is critical so that .insert(...).select() / RETURNING * succeeds for both guests and members
CREATE POLICY "Users and guests can view their orders"
  ON public.orders FOR SELECT
  TO public
  USING (
    user_id IS NULL 
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

-- 3. Allow authenticated users to update their own orders
CREATE POLICY "Users can update their own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure permissions are granted to public roles
GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
