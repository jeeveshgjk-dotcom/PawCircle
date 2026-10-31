-- ==============================================================================
-- PawCircle: Supabase Schema Migration (Stage 1)
-- Authentication, Profiles, Households, Household Memberships, and Pets
-- ==============================================================================

-- 1. Create Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'caretaker')),
  bio TEXT DEFAULT '',
  experience_years INTEGER DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  availability TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. Create Households table
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_households_created_by ON public.households(created_by);

-- 3. Create Household Members table
CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_household UNIQUE (household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_user ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON public.household_members(household_id);

-- 4. Create Pets table
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('Dog', 'Cat', 'Bird', 'Rabbit', 'Fish', 'Other')),
  breed TEXT DEFAULT '',
  birth_date DATE,
  notes TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pets_household ON public.pets(household_id);

-- ==============================================================================
-- Security Definier Helper Functions (to prevent RLS recursion)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_household_member(h_id UUID, u_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = h_id AND user_id = u_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_household_owner(h_id UUID, u_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = h_id AND user_id = u_id AND role = 'owner'
  );
$$;

-- Idempotent onboarding function: safely gets or creates the user's primary household
CREATE OR REPLACE FUNCTION public.get_or_create_primary_household(p_name TEXT DEFAULT NULL)
RETURNS TABLE (
  household_id UUID,
  household_name TEXT,
  member_role TEXT,
  is_new BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_household_id UUID;
  v_name TEXT;
  v_role TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is already in a household
  SELECT hm.household_id, h.name, hm.role
  INTO v_household_id, v_name, v_role
  FROM public.household_members hm
  JOIN public.households h ON h.id = hm.household_id
  WHERE hm.user_id = v_user_id
  ORDER BY hm.created_at ASC
  LIMIT 1;

  IF v_household_id IS NOT NULL THEN
    RETURN QUERY SELECT v_household_id, v_name, v_role, false;
    RETURN;
  END IF;

  -- Create new household
  v_name := COALESCE(NULLIF(TRIM(p_name), ''), 'My Household');
  
  INSERT INTO public.households (name, created_by)
  VALUES (v_name, v_user_id)
  RETURNING id INTO v_household_id;

  -- Add user as owner
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (v_household_id, v_user_id, 'owner')
  RETURNING role INTO v_role;

  RETURN QUERY SELECT v_household_id, v_name, v_role, true;
END;
$$;

-- Trigger to automatically create or update profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, 'User'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on all exposed tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. Households Policies
DROP POLICY IF EXISTS "Members can view their households" ON public.households;
CREATE POLICY "Members can view their households"
  ON public.households
  FOR SELECT
  TO authenticated
  USING (public.is_household_member(id, auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;
CREATE POLICY "Authenticated users can create households"
  ON public.households
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Household owners can update their household" ON public.households;
CREATE POLICY "Household owners can update their household"
  ON public.households
  FOR UPDATE
  TO authenticated
  USING (public.is_household_owner(id, auth.uid()))
  WITH CHECK (public.is_household_owner(id, auth.uid()));

DROP POLICY IF EXISTS "Household owners can delete their household" ON public.households;
CREATE POLICY "Household owners can delete their household"
  ON public.households
  FOR DELETE
  TO authenticated
  USING (public.is_household_owner(id, auth.uid()));

-- 3. Household Members Policies
DROP POLICY IF EXISTS "Members can view household members" ON public.household_members;
CREATE POLICY "Members can view household members"
  ON public.household_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_household_member(household_id, auth.uid())
  );

DROP POLICY IF EXISTS "Owners or creators can add household members" ON public.household_members;
CREATE POLICY "Owners or creators can add household members"
  ON public.household_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Case 1: Creator adding themselves as owner during household creation
    (user_id = auth.uid() AND (SELECT created_by FROM public.households WHERE id = household_id) = auth.uid())
    -- Case 2: Existing owner adding a member
    OR public.is_household_owner(household_id, auth.uid())
  );

DROP POLICY IF EXISTS "Owners can update household members" ON public.household_members;
CREATE POLICY "Owners can update household members"
  ON public.household_members
  FOR UPDATE
  TO authenticated
  USING (public.is_household_owner(household_id, auth.uid()))
  WITH CHECK (public.is_household_owner(household_id, auth.uid()));

DROP POLICY IF EXISTS "Owners or self can remove household members" ON public.household_members;
CREATE POLICY "Owners or self can remove household members"
  ON public.household_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_household_owner(household_id, auth.uid())
  );

-- 4. Pets Policies
DROP POLICY IF EXISTS "Household members can view pets" ON public.pets;
CREATE POLICY "Household members can view pets"
  ON public.pets
  FOR SELECT
  TO authenticated
  USING (public.is_household_member(household_id, auth.uid()));

DROP POLICY IF EXISTS "Household owners can insert pets" ON public.pets;
CREATE POLICY "Household owners can insert pets"
  ON public.pets
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_household_owner(household_id, auth.uid()));

DROP POLICY IF EXISTS "Household owners can update pets" ON public.pets;
CREATE POLICY "Household owners can update pets"
  ON public.pets
  FOR UPDATE
  TO authenticated
  USING (public.is_household_owner(household_id, auth.uid()))
  WITH CHECK (public.is_household_owner(household_id, auth.uid()));

DROP POLICY IF EXISTS "Household owners can delete pets" ON public.pets;
CREATE POLICY "Household owners can delete pets"
  ON public.pets
  FOR DELETE
  TO authenticated
  USING (public.is_household_owner(household_id, auth.uid()));

-- ==============================================================================
-- Storage Bucket for Private Pet Photos
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-photos',
  'pet-photos',
  false,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Owner-scoped storage path ({user_id}/{filename})
DROP POLICY IF EXISTS "Users can view their own pet photos" ON storage.objects;
CREATE POLICY "Users can view their own pet photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can upload their own pet photos" ON storage.objects;
CREATE POLICY "Users can upload their own pet photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own pet photos" ON storage.objects;
CREATE POLICY "Users can update their own pet photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own pet photos" ON storage.objects;
CREATE POLICY "Users can delete their own pet photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

