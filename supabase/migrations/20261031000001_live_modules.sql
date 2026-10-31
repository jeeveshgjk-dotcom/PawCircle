-- ==============================================================================
-- PawCircle: Supabase Schema Migration (Stage 2 - Full Live Modules)
-- Care Opportunities, Applications, Assignments, Routines, Care Tasks,
-- Care Records, Family Members, Memories, Checklists, Earnings Entries
-- ==============================================================================

-- 1. Family Members table
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Family Helper',
  responsibilities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_family_members_household ON public.family_members(household_id);

-- 2. Care Opportunities (Jobs posted by pet owners)
CREATE TABLE IF NOT EXISTS public.care_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  offered_amount_inr NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'closed')),
  tasks TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_care_opportunities_household ON public.care_opportunities(owner_household_id);
CREATE INDEX IF NOT EXISTS idx_care_opportunities_status ON public.care_opportunities(status);

-- 3. Applications
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.care_opportunities(id) ON DELETE CASCADE,
  caretaker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'selected', 'rejected', 'withdrawn')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_caretaker_opportunity UNIQUE (opportunity_id, caretaker_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_caretaker ON public.applications(caretaker_id);

-- 4. Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.care_opportunities(id) ON DELETE CASCADE,
  caretaker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  agreed_amount_inr NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'in_progress', 'submitted_for_review', 'approved', 'cancelled')),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assignments_opportunity ON public.assignments(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_assignments_caretaker ON public.assignments(caretaker_id);

-- 5. Routines (Daily recurring care schedules)
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'feeding',
  time TEXT NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'daily',
  assigned_member_id UUID,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_routines_household ON public.routines(household_id);
CREATE INDEX IF NOT EXISTS idx_routines_pet ON public.routines(pet_id);

-- 6. Care Tasks (Individual actionable tasks)
CREATE TABLE IF NOT EXISTS public.care_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES public.routines(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_care_tasks_household ON public.care_tasks(household_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_due ON public.care_tasks(due_at);

-- 7. Health Records
CREATE TABLE IF NOT EXISTS public.care_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vaccination', 'grooming', 'vet_visit', 'medication', 'other')),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  next_due_date DATE,
  notes TEXT,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_care_records_household ON public.care_records(household_id);
CREATE INDEX IF NOT EXISTS idx_care_records_pet ON public.care_records(pet_id);

-- 8. Memories (PetTime Capsule)
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  photo_url TEXT,
  milestone BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_memories_household ON public.memories(household_id);
CREATE INDEX IF NOT EXISTS idx_memories_pet ON public.memories(pet_id);

-- 9. Checklists (AI Care Checklists)
CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_instructions TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('draft', 'approved')),
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_checklists_household ON public.checklists(household_id);

-- 10. Earnings Entries
CREATE TABLE IF NOT EXISTS public.earnings_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  caretaker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_inr NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'marked_paid')),
  approved_at TIMESTAMPTZ,
  marked_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_earnings_caretaker ON public.earnings_entries(caretaker_id);

-- ==============================================================================
-- Row Level Security (RLS) Policies on All New Tables
-- ==============================================================================

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings_entries ENABLE ROW LEVEL SECURITY;

-- 1. Family Members Policies
CREATE POLICY "Members can view household family members" ON public.family_members
  FOR SELECT TO authenticated USING (public.is_household_member(household_id, auth.uid()));

CREATE POLICY "Owners can manage household family members" ON public.family_members
  FOR ALL TO authenticated USING (public.is_household_owner(household_id, auth.uid()))
  WITH CHECK (public.is_household_owner(household_id, auth.uid()));

-- 2. Care Opportunities Policies
CREATE POLICY "Authenticated users can view open opportunities or own household opportunities" ON public.care_opportunities
  FOR SELECT TO authenticated USING (status = 'open' OR public.is_household_member(owner_household_id, auth.uid()));

CREATE POLICY "Owners can manage household opportunities" ON public.care_opportunities
  FOR ALL TO authenticated USING (public.is_household_owner(owner_household_id, auth.uid()))
  WITH CHECK (public.is_household_owner(owner_household_id, auth.uid()));

-- 3. Applications Policies
CREATE POLICY "View applications" ON public.applications
  FOR SELECT TO authenticated USING (
    caretaker_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.care_opportunities co WHERE co.id = opportunity_id AND public.is_household_member(co.owner_household_id, auth.uid()))
  );

CREATE POLICY "Caretakers can submit applications" ON public.applications
  FOR INSERT TO authenticated WITH CHECK (caretaker_id = auth.uid());

CREATE POLICY "Update applications" ON public.applications
  FOR UPDATE TO authenticated USING (
    caretaker_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.care_opportunities co WHERE co.id = opportunity_id AND public.is_household_owner(co.owner_household_id, auth.uid()))
  );

-- 4. Assignments Policies
CREATE POLICY "View assignments" ON public.assignments
  FOR SELECT TO authenticated USING (
    caretaker_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.care_opportunities co WHERE co.id = opportunity_id AND public.is_household_member(co.owner_household_id, auth.uid()))
  );

CREATE POLICY "Manage assignments" ON public.assignments
  FOR ALL TO authenticated USING (
    caretaker_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.care_opportunities co WHERE co.id = opportunity_id AND public.is_household_owner(co.owner_household_id, auth.uid()))
  );

-- 5. Routines Policies
CREATE POLICY "View routines" ON public.routines
  FOR SELECT TO authenticated USING (public.is_household_member(household_id, auth.uid()));

CREATE POLICY "Manage routines" ON public.routines
  FOR ALL TO authenticated USING (public.is_household_owner(household_id, auth.uid()))
  WITH CHECK (public.is_household_owner(household_id, auth.uid()));

-- 6. Care Tasks Policies
CREATE POLICY "View care tasks" ON public.care_tasks
  FOR SELECT TO authenticated USING (
    public.is_household_member(household_id, auth.uid()) OR
    (assignment_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.caretaker_id = auth.uid()))
  );

CREATE POLICY "Manage care tasks" ON public.care_tasks
  FOR ALL TO authenticated USING (
    public.is_household_owner(household_id, auth.uid()) OR
    (assignment_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.caretaker_id = auth.uid()))
  );

-- 7. Care Records Policies
CREATE POLICY "View care records" ON public.care_records
  FOR SELECT TO authenticated USING (public.is_household_member(household_id, auth.uid()));

CREATE POLICY "Manage care records" ON public.care_records
  FOR ALL TO authenticated USING (public.is_household_owner(household_id, auth.uid()))
  WITH CHECK (public.is_household_owner(household_id, auth.uid()));

-- 8. Memories Policies
CREATE POLICY "View memories" ON public.memories
  FOR SELECT TO authenticated USING (public.is_household_member(household_id, auth.uid()));

CREATE POLICY "Manage memories" ON public.memories
  FOR ALL TO authenticated USING (public.is_household_owner(household_id, auth.uid()))
  WITH CHECK (public.is_household_owner(household_id, auth.uid()));

-- 9. Checklists Policies
CREATE POLICY "View checklists" ON public.checklists
  FOR SELECT TO authenticated USING (public.is_household_member(household_id, auth.uid()));

CREATE POLICY "Manage checklists" ON public.checklists
  FOR ALL TO authenticated USING (public.is_household_owner(household_id, auth.uid()))
  WITH CHECK (public.is_household_owner(household_id, auth.uid()));

-- 10. Earnings Entries Policies
CREATE POLICY "View earnings entries" ON public.earnings_entries
  FOR SELECT TO authenticated USING (
    caretaker_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.care_opportunities co ON a.opportunity_id = co.id
      WHERE a.id = assignment_id AND public.is_household_member(co.owner_household_id, auth.uid())
    )
  );

CREATE POLICY "Manage earnings entries" ON public.earnings_entries
  FOR ALL TO authenticated USING (
    caretaker_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.care_opportunities co ON a.opportunity_id = co.id
      WHERE a.id = assignment_id AND public.is_household_owner(co.owner_household_id, auth.uid())
    )
  );

