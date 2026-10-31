-- ==============================================================================
-- PawCircle: Supabase Schema Migration (Fixes & Multi-Owner Family Hub Support)
-- 1. Allow authenticated users to view profiles (so pet owners can discover
--    other pet owners to add to their household, and caretakers see owner info).
-- 2. Allow household owners to remove household members.
-- 3. Allow caretakers to view pets linked to open care opportunities or assignments.
-- ==============================================================================

-- 1. Profiles: Allow authenticated users to view profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Household Members: Allow owners to remove members
DROP POLICY IF EXISTS "Owners can remove household members" ON public.household_members;

CREATE POLICY "Owners can remove household members"
  ON public.household_members
  FOR DELETE
  TO authenticated
  USING (public.is_household_owner(household_id, auth.uid()));

-- 3. Pets: Allow caretakers to view pets for open opportunities or active assignments
DROP POLICY IF EXISTS "Caretakers can view pets with open opportunities or assignments" ON public.pets;

CREATE POLICY "Caretakers can view pets with open opportunities or assignments"
  ON public.pets
  FOR SELECT
  TO authenticated
  USING (
    public.is_household_member(household_id, auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.care_opportunities co
      WHERE co.pet_id = id AND (
        co.status = 'open' OR
        EXISTS (
          SELECT 1 FROM public.assignments a
          WHERE a.opportunity_id = co.id AND a.caretaker_id = auth.uid()
        )
      )
    )
  );

-- 4. Ensure care_opportunities has denormalized pet details for optimal marketplace display
ALTER TABLE public.care_opportunities ADD COLUMN IF NOT EXISTS pet_name TEXT;
ALTER TABLE public.care_opportunities ADD COLUMN IF NOT EXISTS pet_species TEXT;
ALTER TABLE public.care_opportunities ADD COLUMN IF NOT EXISTS pet_breed TEXT;
ALTER TABLE public.care_opportunities ADD COLUMN IF NOT EXISTS pet_photo_url TEXT;
ALTER TABLE public.care_opportunities ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- 5. Ensure applications stores caretaker_name
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS caretaker_name TEXT;

