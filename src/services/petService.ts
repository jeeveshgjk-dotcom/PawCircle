import { supabase } from '../lib/supabase';
import type { DbPet, PetFormData } from '../types/database';

export interface PetWithPhoto extends DbPet {
  displayPhotoUrl: string | null;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function getSharedLocalPets(householdId: string): PetWithPhoto[] {
  try {
    const raw = localStorage.getItem('pawcircle_live_pets');
    if (!raw) return [];
    const list: PetWithPhoto[] = JSON.parse(raw);
    return list.filter(p => p.household_id === householdId);
  } catch {
    return [];
  }
}

function saveSharedLocalPet(pet: PetWithPhoto): void {
  try {
    const raw = localStorage.getItem('pawcircle_live_pets');
    const list: PetWithPhoto[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(p => p.id === pet.id);
    if (idx >= 0) {
      list[idx] = pet;
    } else {
      list.unshift(pet);
    }
    localStorage.setItem('pawcircle_live_pets', JSON.stringify(list));
  } catch (err) {
    console.error('Error saving local pet:', err);
  }
}

export async function uploadPetPhoto(userId: string, file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPG, PNG, WEBP, or GIF image.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Image too large. Maximum file size is 5 MB.');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('pet-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  return data.path;
}

export async function resolvePhotoUrl(photoUrl: string | null): Promise<string | null> {
  if (!photoUrl) return null;

  // If it's already an HTTP URL (external/Unsplash or base64 data), return as is
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('data:')) {
    return photoUrl;
  }

  // Otherwise, it is a private storage path: create a temporary signed URL (valid for 1 hour)
  try {
    const { data, error } = await supabase.storage
      .from('pet-photos')
      .createSignedUrl(photoUrl, 3600);

    if (error || !data?.signedUrl) {
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Error resolving signed URL:', err);
    return null;
  }
}

export async function getPets(householdId: string): Promise<PetWithPhoto[]> {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const petsWithPhotos = await Promise.all(
        (data as DbPet[]).map(async (pet) => {
          const displayPhotoUrl = await resolvePhotoUrl(pet.photo_url);
          const item = { ...pet, displayPhotoUrl };
          saveSharedLocalPet(item);
          return item;
        })
      );
      return petsWithPhotos;
    }
  } catch (err) {
    console.warn('getPets Supabase query failed, falling back to shared storage:', err);
  }

  return getSharedLocalPets(householdId);
}

export async function getPetById(petId: string): Promise<PetWithPhoto> {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .single();

    if (!error && data) {
      const pet = data as DbPet;
      const displayPhotoUrl = await resolvePhotoUrl(pet.photo_url);
      const item = { ...pet, displayPhotoUrl };
      saveSharedLocalPet(item);
      return item;
    }
  } catch {
    // fallback
  }

  const raw = localStorage.getItem('pawcircle_live_pets');
  const list: PetWithPhoto[] = raw ? JSON.parse(raw) : [];
  const found = list.find(p => p.id === petId);
  if (found) return found;

  throw new Error('Pet not found');
}

export async function createPet(
  householdId: string,
  formData: PetFormData,
  photoFile?: File | null,
  userId?: string
): Promise<DbPet> {
  let photoPath = formData.photoUrl || null;

  if (photoFile && userId) {
    try {
      photoPath = await uploadPetPhoto(userId, photoFile);
    } catch (e) {
      console.warn('Storage upload failed, falling back to local photo preview:', e);
    }
  }

  const newPetId = crypto.randomUUID();
  const now = new Date().toISOString();
  const newPet: DbPet = {
    id: newPetId,
    household_id: householdId,
    name: formData.name.trim(),
    species: formData.species,
    breed: formData.breed?.trim() || null,
    birth_date: formData.birthDate || null,
    notes: formData.notes?.trim() || null,
    photo_url: photoPath,
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from('pets')
      .insert(newPet)
      .select()
      .single();

    if (!error && data) {
      const displayPhotoUrl = await resolvePhotoUrl(data.photo_url);
      saveSharedLocalPet({ ...data, displayPhotoUrl });
      return data as DbPet;
    }
  } catch {
    // fallback
  }

  saveSharedLocalPet({ ...newPet, displayPhotoUrl: photoPath });
  return newPet;
}

export async function updatePet(
  petId: string,
  formData: PetFormData,
  photoFile?: File | null,
  userId?: string
): Promise<DbPet> {
  let photoPath = formData.photoUrl || null;

  if (photoFile && userId) {
    try {
      photoPath = await uploadPetPhoto(userId, photoFile);
    } catch (e) {
      console.warn('Storage upload failed, falling back:', e);
    }
  }

  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('pets')
      .update({
        name: formData.name.trim(),
        species: formData.species,
        breed: formData.breed?.trim() || null,
        birth_date: formData.birthDate || null,
        notes: formData.notes?.trim() || null,
        photo_url: photoPath,
        updated_at: now,
      })
      .eq('id', petId)
      .select()
      .single();

    if (!error && data) {
      const displayPhotoUrl = await resolvePhotoUrl(data.photo_url);
      saveSharedLocalPet({ ...data, displayPhotoUrl });
      return data as DbPet;
    }
  } catch {
    // fallback
  }

  const raw = localStorage.getItem('pawcircle_live_pets');
  const list: PetWithPhoto[] = raw ? JSON.parse(raw) : [];
  const idx = list.findIndex(p => p.id === petId);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      name: formData.name.trim(),
      species: formData.species,
      breed: formData.breed?.trim() || null,
      birth_date: formData.birthDate || null,
      notes: formData.notes?.trim() || null,
      photo_url: photoPath || list[idx].photo_url,
      displayPhotoUrl: photoPath || list[idx].displayPhotoUrl,
      updated_at: now,
    };
    localStorage.setItem('pawcircle_live_pets', JSON.stringify(list));
    return list[idx];
  }

  throw new Error('Pet not found');
}

export async function deletePet(petId: string): Promise<void> {
  try {
    await supabase.from('pets').delete().eq('id', petId);
  } catch {
    // fallback
  }

  const raw = localStorage.getItem('pawcircle_live_pets');
  if (raw) {
    const list: PetWithPhoto[] = JSON.parse(raw);
    localStorage.setItem('pawcircle_live_pets', JSON.stringify(list.filter(p => p.id !== petId)));
  }
}
