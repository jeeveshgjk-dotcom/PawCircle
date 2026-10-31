import Dexie, { type EntityTable } from 'dexie';
import type {
  Household, FamilyMember, Pet, CaretakerProfile, CareOpportunity,
  Application, Assignment, Routine, CareTask, CareRecord,
  EarningsEntry, Memory, Checklist,
} from '../types';

export class PawCircleDB extends Dexie {
  households!: EntityTable<Household, 'id'>;
  familyMembers!: EntityTable<FamilyMember, 'id'>;
  pets!: EntityTable<Pet, 'id'>;
  caretakerProfiles!: EntityTable<CaretakerProfile, 'id'>;
  careOpportunities!: EntityTable<CareOpportunity, 'id'>;
  applications!: EntityTable<Application, 'id'>;
  assignments!: EntityTable<Assignment, 'id'>;
  routines!: EntityTable<Routine, 'id'>;
  careTasks!: EntityTable<CareTask, 'id'>;
  careRecords!: EntityTable<CareRecord, 'id'>;
  earningsEntries!: EntityTable<EarningsEntry, 'id'>;
  memories!: EntityTable<Memory, 'id'>;
  checklists!: EntityTable<Checklist, 'id'>;

  constructor() {
    super('pawcircle');
    this.version(1).stores({
      households:        'id, name',
      familyMembers:     'id, householdId, name',
      pets:              'id, householdId, name, species',
      caretakerProfiles: 'id, displayName',
      careOpportunities: 'id, ownerHouseholdId, petId, status',
      applications:      'id, opportunityId, caretakerId, status',
      assignments:       'id, opportunityId, caretakerId, applicationId, status',
      routines:          'id, petId, assignmentId, type, active',
      careTasks:         'id, petId, routineId, assignmentId, status, dueAt',
      careRecords:       'id, petId, type, eventDate',
      earningsEntries:   'id, assignmentId, caretakerId, status',
      memories:          'id, petId, occurredAt',
      checklists:        'id, petId, status',
    });
  }
}

export const db = new PawCircleDB();

