import { supabase } from '../lib/supabase';
import type { DbProfile } from '../types/database';

// ─── Shared Local Storage Fallback Helpers ─────────────────────────────────────
// Uses shared storage across browser sessions so that Pet Owners, Co-Owners, and
// Caretakers can interact seamlessly on the marketplace and within shared households.

function getSharedRecords<T>(tableName: string): T[] {
  try {
    // 1. First check shared key
    let records: T[] = [];
    const sharedRaw = localStorage.getItem(`pawcircle_live_${tableName}`);
    if (sharedRaw) {
      records = JSON.parse(sharedRaw);
    }

    // 2. Also check and migrate any legacy user-prefixed keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pawcircle_live_') && key.endsWith(`_${tableName}`) && key !== `pawcircle_live_${tableName}`) {
        try {
          const legacyItems: T[] = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(legacyItems) && legacyItems.length > 0) {
            legacyItems.forEach(item => {
              const itemId = (item as any)?.id;
              if (itemId && !records.some((existing: any) => existing.id === itemId)) {
                records.push(item);
              }
            });
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    return records;
  } catch {
    return [];
  }
}

function setSharedRecords<T>(tableName: string, records: T[]): void {
  try {
    localStorage.setItem(`pawcircle_live_${tableName}`, JSON.stringify(records));
  } catch (err) {
    console.error(`Failed to save records for ${tableName}:`, err);
  }
}

// ─── Registered Profiles Registry ─────────────────────────────────────────────

export interface RegisteredUserSummary {
  id: string;
  email: string | null;
  display_name: string;
  role: 'owner' | 'caretaker';
  photo_url?: string | null;
  bio?: string | null;
}

export function saveProfileToRegistry(profile: RegisteredUserSummary): void {
  try {
    const list = getSharedRecords<RegisteredUserSummary>('profiles');
    const idx = list.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...profile };
    } else {
      list.push(profile);
    }
    setSharedRecords('profiles', list);
  } catch (err) {
    console.error('Error saving profile to registry:', err);
  }
}

export async function getAvailablePetOwners(
  currentUserId: string,
  householdId: string
): Promise<{ available: RegisteredUserSummary[]; existingCoOwners: RegisteredUserSummary[] }> {
  let allProfiles: RegisteredUserSummary[] = [];

  // 1. Try fetching from Supabase profiles
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, role, photo_url, bio');

    if (!error && data && data.length > 0) {
      allProfiles = data as RegisteredUserSummary[];
      // Sync to shared local registry
      allProfiles.forEach(p => saveProfileToRegistry(p));
    } else {
      allProfiles = getSharedRecords<RegisteredUserSummary>('profiles');
    }
  } catch {
    allProfiles = getSharedRecords<RegisteredUserSummary>('profiles');
  }

  // 2. Fetch existing household members
  const existingMemberIds = new Set<string>();
  try {
    const { data: memberRows } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', householdId);

    if (memberRows) {
      memberRows.forEach((r: any) => existingMemberIds.add(r.user_id));
    }
  } catch {
    // fallback
  }

  const localMemberRows = getSharedRecords<{ household_id: string; user_id: string }>(
    'household_members'
  );
  localMemberRows
    .filter(m => m.household_id === householdId)
    .forEach(m => existingMemberIds.add(m.user_id));

  // Partition into existing co-owners (excluding current user) and available pet owners
  const existingCoOwners: RegisteredUserSummary[] = allProfiles.filter(
    p => p.id !== currentUserId && existingMemberIds.has(p.id)
  );

  const available: RegisteredUserSummary[] = allProfiles.filter(
    p => p.id !== currentUserId && p.role === 'owner' && !existingMemberIds.has(p.id)
  );

  return { available, existingCoOwners };
}

// ─── Live Care Opportunities (Jobs) ──────────────────────────────────────────

export interface LiveCareOpportunity {
  id: string;
  owner_household_id: string;
  pet_id: string;
  created_by: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  location: string;
  offered_amount_inr: number;
  status: 'open' | 'filled' | 'closed';
  tasks: string[];
  pet_name?: string;
  pet_species?: string;
  pet_breed?: string;
  pet_photo_url?: string;
  owner_name?: string;
  created_at: string;
  updated_at: string;
}

export interface LiveApplication {
  id: string;
  opportunity_id: string;
  caretaker_id: string;
  caretaker_name?: string;
  message: string;
  status: 'submitted' | 'selected' | 'rejected' | 'withdrawn';
  applied_at: string;
  updated_at: string;
}

export interface LiveAssignment {
  id: string;
  opportunity_id: string;
  caretaker_id: string;
  caretaker_name?: string;
  application_id?: string;
  agreed_amount_inr: number;
  status: 'offered' | 'accepted' | 'in_progress' | 'submitted_for_review' | 'approved' | 'cancelled';
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export async function getLiveHouseholdJobs(householdId: string): Promise<LiveCareOpportunity[]> {
  try {
    const { data, error } = await supabase
      .from('care_opportunities')
      .select('*')
      .eq('owner_household_id', householdId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as LiveCareOpportunity[];
    }
  } catch {
    // fallback
  }

  const local = getSharedRecords<LiveCareOpportunity>('care_opportunities');
  return local.filter(j => j.owner_household_id === householdId);
}

export async function getLiveOpenJobs(): Promise<LiveCareOpportunity[]> {
  try {
    const { data, error } = await supabase
      .from('care_opportunities')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as LiveCareOpportunity[];
    }
  } catch {
    // fallback
  }

  const local = getSharedRecords<LiveCareOpportunity>('care_opportunities');
  return local.filter(j => j.status === 'open');
}

export async function createLiveJob(
  userId: string,
  householdId: string,
  job: {
    pet_id: string;
    title: string;
    description: string;
    start_at: string;
    end_at: string;
    location: string;
    offered_amount_inr: number;
    tasks: string[];
    pet_name?: string;
    pet_species?: string;
    pet_breed?: string;
    pet_photo_url?: string;
    owner_name?: string;
  }
): Promise<LiveCareOpportunity> {
  const newJob: LiveCareOpportunity = {
    id: crypto.randomUUID(),
    owner_household_id: householdId,
    created_by: userId,
    pet_id: job.pet_id,
    title: job.title,
    description: job.description,
    start_at: job.start_at,
    end_at: job.end_at,
    location: job.location,
    offered_amount_inr: job.offered_amount_inr,
    status: 'open',
    tasks: job.tasks,
    pet_name: job.pet_name,
    pet_species: job.pet_species,
    pet_breed: job.pet_breed,
    pet_photo_url: job.pet_photo_url,
    owner_name: job.owner_name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('care_opportunities').insert(newJob);
  } catch {
    // local fallback
  }

  const list = getSharedRecords<LiveCareOpportunity>('care_opportunities');
  list.unshift(newJob);
  setSharedRecords('care_opportunities', list);
  return newJob;
}

export async function getLiveJobApplications(opportunityId: string): Promise<LiveApplication[]> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('opportunity_id', opportunityId);

    if (!error && data && data.length > 0) {
      return data as LiveApplication[];
    }
  } catch {
    // fallback
  }

  const local = getSharedRecords<LiveApplication>('applications');
  return local.filter(a => a.opportunity_id === opportunityId);
}

export async function applyToLiveJob(
  caretakerId: string,
  opportunityId: string,
  message: string,
  caretakerName?: string
): Promise<LiveApplication> {
  const application: LiveApplication = {
    id: crypto.randomUUID(),
    opportunity_id: opportunityId,
    caretaker_id: caretakerId,
    caretaker_name: caretakerName || 'Caretaker',
    message,
    status: 'submitted',
    applied_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('applications').insert(application);
  } catch {
    // fallback
  }

  const list = getSharedRecords<LiveApplication>('applications');
  list.push(application);
  setSharedRecords('applications', list);
  return application;
}

export async function getLiveJobAssignments(opportunityId: string): Promise<LiveAssignment[]> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('opportunity_id', opportunityId);

    if (!error && data && data.length > 0) {
      return data as LiveAssignment[];
    }
  } catch {
    // fallback
  }

  const local = getSharedRecords<LiveAssignment>('assignments');
  return local.filter(a => a.opportunity_id === opportunityId);
}

export async function selectLiveApplicant(
  householdId: string,
  opportunity: LiveCareOpportunity,
  application: LiveApplication
): Promise<void> {
  const now = new Date().toISOString();
  const assignId = crypto.randomUUID();

  // 1. Create assignment
  const assignment: LiveAssignment = {
    id: assignId,
    opportunity_id: opportunity.id,
    caretaker_id: application.caretaker_id,
    caretaker_name: application.caretaker_name,
    application_id: application.id,
    agreed_amount_inr: opportunity.offered_amount_inr,
    status: 'offered',
    created_at: now,
    updated_at: now,
  };

  // 2. Create tasks
  const tasksToCreate: LiveCareTask[] = opportunity.tasks.map(taskTitle => ({
    id: crypto.randomUUID(),
    household_id: householdId,
    pet_id: opportunity.pet_id,
    assignment_id: assignId,
    title: taskTitle,
    due_at: opportunity.start_at,
    status: 'pending',
    created_at: now,
    updated_at: now,
  }));

  // 3. Create simulated earnings entry
  const earning: LiveEarningsEntry = {
    id: crypto.randomUUID(),
    assignment_id: assignId,
    caretaker_id: application.caretaker_id,
    amount_inr: opportunity.offered_amount_inr,
    status: 'pending',
    created_at: now,
    updated_at: now,
  };

  try {
    await supabase.from('applications').update({ status: 'selected', updated_at: now }).eq('id', application.id);
    await supabase.from('care_opportunities').update({ status: 'filled', updated_at: now }).eq('id', opportunity.id);
    await supabase.from('assignments').insert(assignment);
    for (const t of tasksToCreate) await supabase.from('care_tasks').insert(t);
    await supabase.from('earnings_entries').insert(earning);
  } catch {
    // fallback
  }

  // Update shared local records
  const apps = getSharedRecords<LiveApplication>('applications');
  apps.forEach(a => {
    if (a.opportunity_id === opportunity.id) {
      a.status = a.id === application.id ? 'selected' : 'rejected';
      a.updated_at = now;
    }
  });
  setSharedRecords('applications', apps);

  const jobs = getSharedRecords<LiveCareOpportunity>('care_opportunities');
  const targetJob = jobs.find(j => j.id === opportunity.id);
  if (targetJob) {
    targetJob.status = 'filled';
    targetJob.updated_at = now;
    setSharedRecords('care_opportunities', jobs);
  }

  const assigns = getSharedRecords<LiveAssignment>('assignments');
  assigns.push(assignment);
  setSharedRecords('assignments', assigns);

  const currentTasks = getSharedRecords<LiveCareTask>('care_tasks');
  currentTasks.push(...tasksToCreate);
  setSharedRecords('care_tasks', currentTasks);

  const currentEarnings = getSharedRecords<LiveEarningsEntry>('earnings_entries');
  currentEarnings.push(earning);
  setSharedRecords('earnings_entries', currentEarnings);
}

export async function approveLiveWork(assignmentId: string, earningId: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    await supabase.from('assignments').update({ status: 'approved', updated_at: now }).eq('id', assignmentId);
    await supabase.from('earnings_entries').update({ status: 'approved', approved_at: now, updated_at: now }).eq('id', earningId);
  } catch {
    // fallback
  }

  const assigns = getSharedRecords<LiveAssignment>('assignments');
  const targetAssign = assigns.find(a => a.id === assignmentId);
  if (targetAssign) {
    targetAssign.status = 'approved';
    targetAssign.updated_at = now;
    setSharedRecords('assignments', assigns);
  }

  const earnings = getSharedRecords<LiveEarningsEntry>('earnings_entries');
  const targetEarning = earnings.find(e => e.id === earningId || e.assignment_id === assignmentId);
  if (targetEarning) {
    targetEarning.status = 'approved';
    targetEarning.approved_at = now;
    targetEarning.updated_at = now;
    setSharedRecords('earnings_entries', earnings);
  }
}

// ─── Multi-Owner Household Management ─────────────────────────────────────────

export interface LiveHouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: 'owner' | 'member';
  created_at: string;
}

export async function addCoOwnerToHousehold(
  householdId: string,
  targetUser: { id: string; display_name: string; email?: string | null },
  role: 'owner' | 'member' = 'owner',
  responsibilities: string[] = ['Shared Pet Care', 'Health & Diet Decisions']
): Promise<void> {
  const now = new Date().toISOString();
  const membership: LiveHouseholdMember = {
    id: crypto.randomUUID(),
    household_id: householdId,
    user_id: targetUser.id,
    role,
    created_at: now,
  };

  const familyEntry: LiveFamilyMember = {
    id: crypto.randomUUID(),
    household_id: householdId,
    name: targetUser.display_name,
    role: role === 'owner' ? 'Co-Owner (Registered Pet Owner)' : 'Household Member',
    responsibilities,
    created_at: now,
    updated_at: now,
  };

  try {
    await supabase.from('household_members').insert({
      household_id: householdId,
      user_id: targetUser.id,
      role,
    });
    await supabase.from('family_members').insert(familyEntry);
  } catch {
    // fallback
  }

  // Update shared local records
  const members = getSharedRecords<LiveHouseholdMember>('household_members');
  if (!members.some(m => m.household_id === householdId && m.user_id === targetUser.id)) {
    members.push(membership);
    setSharedRecords('household_members', members);
  }

  const famMembers = getSharedRecords<LiveFamilyMember>('family_members');
  famMembers.push(familyEntry);
  setSharedRecords('family_members', famMembers);
}

export async function removeCoOwnerFromHousehold(
  householdId: string,
  userId: string,
  displayName?: string
): Promise<void> {
  try {
    await supabase.from('household_members').delete().eq('household_id', householdId).eq('user_id', userId);
    if (displayName) {
      await supabase.from('family_members').delete().eq('household_id', householdId).eq('name', displayName);
    }
  } catch {
    // fallback
  }

  const members = getSharedRecords<LiveHouseholdMember>('household_members');
  setSharedRecords(
    'household_members',
    members.filter(m => !(m.household_id === householdId && m.user_id === userId))
  );

  if (displayName) {
    const fam = getSharedRecords<LiveFamilyMember>('family_members');
    setSharedRecords(
      'family_members',
      fam.filter(f => !(f.household_id === householdId && f.name === displayName))
    );
  }
}

// ─── Live Schedule & Routines ────────────────────────────────────────────────

export interface LiveRoutine {
  id: string;
  household_id: string;
  pet_id: string;
  title: string;
  type: 'feeding' | 'walking' | 'grooming' | 'play' | 'medication' | 'vet' | 'other';
  time: string;
  recurrence: string;
  assigned_member_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LiveCareTask {
  id: string;
  household_id: string;
  pet_id: string;
  routine_id?: string;
  assignment_id?: string;
  title: string;
  due_at: string;
  status: 'pending' | 'completed' | 'skipped';
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function getLiveRoutines(householdId: string): Promise<LiveRoutine[]> {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('household_id', householdId)
      .eq('active', true);

    if (!error && data && data.length > 0) {
      return data as LiveRoutine[];
    }
  } catch {
    // fallback
  }

  const local = getSharedRecords<LiveRoutine>('routines');
  return local.filter(r => r.household_id === householdId && r.active);
}

export async function createLiveRoutine(
  householdId: string,
  routine: {
    pet_id: string;
    title: string;
    type: LiveRoutine['type'];
    time: string;
    recurrence: string;
    assigned_member_id?: string;
  }
): Promise<LiveRoutine> {
  const newRoutine: LiveRoutine = {
    id: crypto.randomUUID(),
    household_id: householdId,
    pet_id: routine.pet_id,
    title: routine.title,
    type: routine.type,
    time: routine.time,
    recurrence: routine.recurrence,
    assigned_member_id: routine.assigned_member_id,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const todayDue = new Date();
  const [hours, minutes] = routine.time.split(':').map(Number);
  if (!isNaN(hours) && !isNaN(minutes)) {
    todayDue.setHours(hours, minutes, 0, 0);
  }

  const initialTask: LiveCareTask = {
    id: crypto.randomUUID(),
    household_id: householdId,
    pet_id: routine.pet_id,
    routine_id: newRoutine.id,
    title: routine.title,
    due_at: todayDue.toISOString(),
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('routines').insert(newRoutine);
    await supabase.from('care_tasks').insert(initialTask);
  } catch {
    // fallback
  }

  const list = getSharedRecords<LiveRoutine>('routines');
  list.unshift(newRoutine);
  setSharedRecords('routines', list);

  const taskList = getSharedRecords<LiveCareTask>('care_tasks');
  taskList.unshift(initialTask);
  setSharedRecords('care_tasks', taskList);

  return newRoutine;
}

export async function deleteLiveRoutine(routineId: string): Promise<void> {
  try {
    await supabase.from('routines').update({ active: false }).eq('id', routineId);
  } catch {
    // fallback
  }
  const list = getSharedRecords<LiveRoutine>('routines');
  setSharedRecords('routines', list.filter(r => r.id !== routineId));
}

export async function getLiveCareTasks(
  householdId?: string,
  caretakerId?: string
): Promise<LiveCareTask[]> {
  try {
    let query = supabase.from('care_tasks').select('*');
    if (householdId) {
      query = query.eq('household_id', householdId);
    }
    const { data, error } = await query.order('due_at', { ascending: true });
    if (!error && data && data.length > 0) {
      return data as LiveCareTask[];
    }
  } catch {
    // fallback
  }

  const local = getSharedRecords<LiveCareTask>('care_tasks');
  if (householdId) {
    return local.filter(t => t.household_id === householdId);
  }
  if (caretakerId) {
    const assignments = getSharedRecords<LiveAssignment>('assignments');
    const myAssignIds = new Set(assignments.filter(a => a.caretaker_id === caretakerId).map(a => a.id));
    return local.filter(t => t.assignment_id && myAssignIds.has(t.assignment_id));
  }
  return local;
}

export async function completeLiveTask(taskId: string, notes?: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    await supabase
      .from('care_tasks')
      .update({ status: 'completed', completed_at: now, notes })
      .eq('id', taskId);
  } catch {
    // fallback
  }
  const tasks = getSharedRecords<LiveCareTask>('care_tasks');
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = 'completed';
    task.completed_at = now;
    task.notes = notes;
    task.updated_at = now;
    setSharedRecords('care_tasks', tasks);
  }
}

// ─── Live Health Records ─────────────────────────────────────────────────────

export interface LiveCareRecord {
  id: string;
  pet_id: string;
  type: 'vaccination' | 'grooming' | 'vet_visit' | 'medication' | 'other';
  title: string;
  event_date: string;
  next_due_date?: string;
  notes?: string;
  provider?: string;
  created_at: string;
  updated_at: string;
}

export async function getLiveHealthRecords(petIds: string[]): Promise<LiveCareRecord[]> {
  if (petIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('care_records')
      .select('*')
      .in('pet_id', petIds)
      .order('event_date', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as LiveCareRecord[];
    }
  } catch {
    // fallback
  }

  const local = getSharedRecords<LiveCareRecord>('care_records');
  return local.filter(r => petIds.includes(r.pet_id));
}

export async function createLiveHealthRecord(record: {
  pet_id: string;
  type: LiveCareRecord['type'];
  title: string;
  event_date: string;
  next_due_date?: string;
  notes?: string;
  provider?: string;
}): Promise<LiveCareRecord> {
  const newRecord: LiveCareRecord = {
    id: crypto.randomUUID(),
    pet_id: record.pet_id,
    type: record.type,
    title: record.title,
    event_date: record.event_date,
    next_due_date: record.next_due_date,
    notes: record.notes,
    provider: record.provider,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('care_records').insert(newRecord);
  } catch {
    // fallback
  }

  const list = getSharedRecords<LiveCareRecord>('care_records');
  list.unshift(newRecord);
  setSharedRecords('care_records', list);
  return newRecord;
}

export async function deleteLiveHealthRecord(recordId: string): Promise<void> {
  try {
    await supabase.from('care_records').delete().eq('id', recordId);
  } catch {
    // fallback
  }
  const list = getSharedRecords<LiveCareRecord>('care_records');
  setSharedRecords('care_records', list.filter(r => r.id !== recordId));
}

// ─── Live Family Hub ─────────────────────────────────────────────────────────

export interface LiveFamilyMember {
  id: string;
  household_id: string;
  name: string;
  role: string;
  responsibilities: string[];
  created_at: string;
  updated_at: string;
}

export async function getLiveFamilyMembers(householdId: string): Promise<LiveFamilyMember[]> {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as LiveFamilyMember[];
    }
  } catch {
    // fallback
  }

  const local = getSharedRecords<LiveFamilyMember>('family_members');
  return local.filter(m => m.household_id === householdId);
}

export async function createLiveFamilyMember(
  householdId: string,
  member: {
    name: string;
    role: string;
    responsibilities: string[];
  }
): Promise<LiveFamilyMember> {
  const newMember: LiveFamilyMember = {
    id: crypto.randomUUID(),
    household_id: householdId,
    name: member.name,
    role: member.role || 'Family Helper',
    responsibilities: member.responsibilities,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('family_members').insert(newMember);
  } catch {
    // fallback
  }

  const list = getSharedRecords<LiveFamilyMember>('family_members');
  list.push(newMember);
  setSharedRecords('family_members', list);
  return newMember;
}

export async function deleteLiveFamilyMember(memberId: string): Promise<void> {
  try {
    await supabase.from('family_members').delete().eq('id', memberId);
  } catch {
    // fallback
  }
  const list = getSharedRecords<LiveFamilyMember>('family_members');
  setSharedRecords('family_members', list.filter(m => m.id !== memberId));
}

// ─── Live Time Capsule (Memories) ────────────────────────────────────────────

export interface LiveMemory {
  id: string;
  pet_id: string;
  title: string;
  caption: string;
  occurred_at: string;
  photo_url?: string;
  milestone: boolean;
  created_at: string;
  updated_at: string;
}

export async function getLiveMemories(petIds: string[]): Promise<LiveMemory[]> {
  if (petIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .in('pet_id', petIds)
      .order('occurred_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as LiveMemory[];
    }
  } catch {
    // fallback
  }

  const local = getSharedRecords<LiveMemory>('memories');
  return local.filter(m => petIds.includes(m.pet_id));
}

export async function createLiveMemory(memory: {
  pet_id: string;
  title: string;
  caption: string;
  occurred_at: string;
  photo_url?: string;
  milestone: boolean;
}): Promise<LiveMemory> {
  const newMemory: LiveMemory = {
    id: crypto.randomUUID(),
    pet_id: memory.pet_id,
    title: memory.title,
    caption: memory.caption,
    occurred_at: memory.occurred_at,
    photo_url: memory.photo_url,
    milestone: memory.milestone,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('memories').insert(newMemory);
  } catch {
    // fallback
  }

  const list = getSharedRecords<LiveMemory>('memories');
  list.unshift(newMemory);
  setSharedRecords('memories', list);
  return newMemory;
}

export async function deleteLiveMemory(memoryId: string): Promise<void> {
  try {
    await supabase.from('memories').delete().eq('id', memoryId);
  } catch {
    // fallback
  }
  const list = getSharedRecords<LiveMemory>('memories');
  setSharedRecords('memories', list.filter(m => m.id !== memoryId));
}

// ─── Live AI Checklists ──────────────────────────────────────────────────────

export interface LiveChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface LiveChecklist {
  id: string;
  pet_id: string;
  title: string;
  source_instructions: string;
  status: 'draft' | 'approved';
  items: LiveChecklistItem[];
  created_at: string;
  updated_at: string;
}

export async function getLiveChecklists(petIds: string[]): Promise<LiveChecklist[]> {
  if (petIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .in('pet_id', petIds)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as LiveChecklist[];
    }
  } catch {
    // fallback
  }

  const local = getSharedRecords<LiveChecklist>('checklists');
  return local.filter(c => petIds.includes(c.pet_id));
}

export async function saveLiveChecklist(checklist: {
  pet_id: string;
  title: string;
  source_instructions: string;
  items: LiveChecklistItem[];
  status?: 'draft' | 'approved';
}): Promise<LiveChecklist> {
  const newChecklist: LiveChecklist = {
    id: crypto.randomUUID(),
    pet_id: checklist.pet_id,
    title: checklist.title,
    source_instructions: checklist.source_instructions,
    status: checklist.status || 'draft',
    items: checklist.items,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('checklists').insert(newChecklist);
  } catch {
    // fallback
  }

  const list = getSharedRecords<LiveChecklist>('checklists');
  list.unshift(newChecklist);
  setSharedRecords('checklists', list);
  return newChecklist;
}

export async function toggleLiveChecklistItem(
  checklistId: string,
  itemId: string
): Promise<void> {
  const list = getSharedRecords<LiveChecklist>('checklists');
  const checklist = list.find(c => c.id === checklistId);
  if (checklist) {
    const item = checklist.items.find(i => i.id === itemId);
    if (item) {
      item.done = !item.done;
      checklist.updated_at = new Date().toISOString();
      setSharedRecords('checklists', list);
      try {
        await supabase
          .from('checklists')
          .update({ items: checklist.items, updated_at: checklist.updated_at })
          .eq('id', checklistId);
      } catch {
        // fallback
      }
    }
  }
}

export async function deleteLiveChecklist(checklistId: string): Promise<void> {
  try {
    await supabase.from('checklists').delete().eq('id', checklistId);
  } catch {
    // fallback
  }
  const list = getSharedRecords<LiveChecklist>('checklists');
  setSharedRecords('checklists', list.filter(c => c.id !== checklistId));
}

// ─── Live Earnings Ledger ────────────────────────────────────────────────────

export interface LiveEarningsEntry {
  id: string;
  assignment_id: string;
  caretaker_id: string;
  amount_inr: number;
  status: 'pending' | 'approved' | 'marked_paid';
  approved_at?: string;
  marked_paid_at?: string;
  created_at: string;
  updated_at: string;
}

export async function getLiveEarnings(userId: string, isCaretaker: boolean): Promise<LiveEarningsEntry[]> {
  try {
    let query = supabase.from('earnings_entries').select('*');
    if (isCaretaker) {
      query = query.eq('caretaker_id', userId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as LiveEarningsEntry[];
    }
  } catch {
    // fallback
  }

  const local = getSharedRecords<LiveEarningsEntry>('earnings_entries');
  return isCaretaker ? local.filter(e => e.caretaker_id === userId) : local;
}

export async function markLiveEarningsPaid(earningId: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    await supabase
      .from('earnings_entries')
      .update({ status: 'marked_paid', marked_paid_at: now, updated_at: now })
      .eq('id', earningId);
  } catch {
    // fallback
  }
  const list = getSharedRecords<LiveEarningsEntry>('earnings_entries');
  const entry = list.find(e => e.id === earningId);
  if (entry) {
    entry.status = 'marked_paid';
    entry.marked_paid_at = now;
    entry.updated_at = now;
    setSharedRecords('earnings_entries', list);
  }
}
