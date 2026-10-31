// ─── Types ───────────────────────────────────────────────────────────────────

export type Role = 'owner' | 'caretaker';

export interface Household {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  householdId: string;
  name: string;
  role: string;
  avatar?: string;
  responsibilities?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Pet {
  id: string;
  householdId: string;
  name: string;
  species: string;
  breed: string;
  birthDate?: string;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaretakerProfile {
  id: string;
  displayName: string;
  bio: string;
  experienceYears?: number;
  skills: string[];
  availability?: string;
  photoUrl?: string;
  rating?: number;
  completedJobs?: number;
  createdAt: string;
  updatedAt: string;
}

export type OpportunityStatus = 'open' | 'filled' | 'closed';

export interface CareOpportunity {
  id: string;
  ownerHouseholdId: string;
  petId: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  offeredAmountINR: number;
  status: OpportunityStatus;
  tasks: string[];
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 'submitted' | 'selected' | 'rejected' | 'withdrawn';

export interface Application {
  id: string;
  opportunityId: string;
  caretakerId: string;
  message: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
}

export type AssignmentStatus = 'offered' | 'accepted' | 'in_progress' | 'submitted_for_review' | 'approved' | 'cancelled';

export interface Assignment {
  id: string;
  opportunityId: string;
  caretakerId: string;
  applicationId: string;
  agreedAmountINR: number;
  status: AssignmentStatus;
  acceptedAt?: string;
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RoutineType = 'feeding' | 'walking' | 'grooming' | 'play' | 'medication' | 'vet' | 'other';

export interface Routine {
  id: string;
  petId: string;
  assignmentId?: string;
  title: string;
  type: RoutineType;
  time: string;
  recurrence: string;
  assignedMemberId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'pending' | 'completed' | 'skipped';

export interface CareTask {
  id: string;
  petId: string;
  routineId?: string;
  assignmentId?: string;
  title: string;
  dueAt: string;
  status: TaskStatus;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CareRecordType = 'vaccination' | 'grooming' | 'vet_visit' | 'medication' | 'other';

export interface CareRecord {
  id: string;
  petId: string;
  type: CareRecordType;
  title: string;
  eventDate: string;
  nextDueDate?: string;
  notes?: string;
  provider?: string;
  createdAt: string;
  updatedAt: string;
}

export type EarningsStatus = 'pending' | 'approved' | 'marked_paid';

export interface EarningsEntry {
  id: string;
  assignmentId: string;
  caretakerId: string;
  amountINR: number;
  status: EarningsStatus;
  approvedAt?: string;
  markedPaidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  petId: string;
  title: string;
  caption: string;
  occurredAt: string;
  photoUrl?: string;
  linkedCompletionId?: string;
  milestone?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Checklist {
  id: string;
  petId: string;
  title: string;
  sourceInstructions: string;
  status: 'draft' | 'approved';
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

