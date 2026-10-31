export type UserRole = 'owner' | 'caretaker';

export interface DbProfile {
  id: string;
  email: string | null;
  display_name: string;
  role: UserRole;
  bio: string | null;
  experience_years: number;
  skills: string[];
  availability: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbHousehold {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbHouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: 'owner' | 'member';
  created_at: string;
  updated_at: string;
}

export interface DbPet {
  id: string;
  household_id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Bird' | 'Rabbit' | 'Fish' | 'Other';
  breed: string | null;
  birth_date: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PetFormData {
  name: string;
  species: 'Dog' | 'Cat' | 'Bird' | 'Rabbit' | 'Fish' | 'Other';
  breed?: string;
  birthDate?: string;
  notes?: string;
  photoUrl?: string;
}

