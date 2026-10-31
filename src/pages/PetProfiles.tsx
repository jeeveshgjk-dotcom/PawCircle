import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus, ArrowLeft, Edit2, Trash2, Heart, Calendar, FileText,
  Upload, Loader2, AlertCircle, Cloud, RefreshCw
} from 'lucide-react';
import {
  getPets, getPetById, createPet, updatePet, deletePet,
  type PetWithPhoto
} from '../services/petService';
import { MigrationBanner } from '../components/MigrationBanner';

function PetCard({ pet, onDelete }: { pet: PetWithPhoto; onDelete: (id: string, name: string) => void }) {
  const age = pet.birth_date
    ? Math.floor((Date.now() - new Date(pet.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="card-hover group relative">
      <div className="flex items-start gap-4">
        {pet.displayPhotoUrl ? (
          <img
            src={pet.displayPhotoUrl}
            alt={pet.name}
            className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const placeholder = document.createElement('div');
                placeholder.className = 'w-20 h-20 rounded-2xl bg-sage-100 flex items-center justify-center text-3xl flex-shrink-0';
                placeholder.innerText = '🐾';
                parent.appendChild(placeholder);
              }
            }}
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-sage-100 flex items-center justify-center text-3xl flex-shrink-0">
            🐾
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sage-800 text-lg">{pet.name}</h3>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                  <Cloud className="w-2.5 h-2.5" /> Supabase
                </span>
              </div>
              <div className="text-sm text-sage-500">{pet.breed || 'Unknown breed'}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge-green">{pet.species}</span>
                {age !== null && age >= 0 && (
                  <span className="badge bg-sage-50 text-sage-600">
                    {age} yr{age !== 1 ? 's' : ''} old
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                to={`/pets/${pet.id}/edit`}
                className="p-1.5 rounded-lg hover:bg-sage-100 text-sage-400 hover:text-sage-600 transition-colors"
                title="Edit pet"
              >
                <Edit2 className="w-4 h-4" />
              </Link>
              <button
                onClick={() => onDelete(pet.id, pet.name)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-sage-400 hover:text-red-500 transition-colors"
                title="Delete pet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {pet.notes && <p className="text-sm text-sage-500 mt-2 line-clamp-2">{pet.notes}</p>}
        </div>
      </div>
      <div className="flex gap-3 mt-4 pt-4 border-t border-sage-50">
        <Link to={`/health?pet=${pet.id}`} className="flex items-center gap-1.5 text-xs text-sage-500 hover:text-sage-700">
          <Heart className="w-3.5 h-3.5" /> Health Records
        </Link>
        <Link to={`/schedule?pet=${pet.id}`} className="flex items-center gap-1.5 text-xs text-sage-500 hover:text-sage-700">
          <Calendar className="w-3.5 h-3.5" /> Schedule
        </Link>
        <Link to={`/capsule?pet=${pet.id}`} className="flex items-center gap-1.5 text-xs text-sage-500 hover:text-sage-700">
          <FileText className="w-3.5 h-3.5" /> Memories
        </Link>
      </div>
    </div>
  );
}

export function PetForm() {
  const { user, household, migrationNeeded } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');

  const [form, setForm] = useState({
    name: '',
    species: 'Dog' as 'Dog' | 'Cat' | 'Bird' | 'Rabbit' | 'Fish' | 'Other',
    breed: '',
    birthDate: '',
    notes: '',
    photoUrl: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  // Load existing pet from Supabase if editing
  useEffect(() => {
    if (!isEdit || !id) return;

    let isMounted = true;

    async function loadPet() {
      if (!id) return;
      setFetching(true);
      setError(null);
      try {
        const cloudPet = await getPetById(id);
        if (isMounted) {
          setForm({
            name: cloudPet.name,
            species: cloudPet.species,
            breed: cloudPet.breed || '',
            birthDate: cloudPet.birth_date || '',
            notes: cloudPet.notes || '',
            photoUrl: cloudPet.photo_url || '',
          });
          if (cloudPet.displayPhotoUrl) {
            setPhotoPreview(cloudPet.displayPhotoUrl);
          }
        }
      } catch (err: any) {
        console.error('Error loading pet:', err);
        if (isMounted) setError(err.message || 'Failed to load pet details.');
      } finally {
        if (isMounted) setFetching(false);
      }
    }

    loadPet();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Please select a JPG, PNG, WEBP, or GIF image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }

    setError(null);
    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (k === 'photoUrl') {
      setPhotoFile(null);
      setPhotoPreview(e.target.value || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Pet name is required.');
      return;
    }

    if (!household?.id || !user?.id) {
      setError('No active household found. Please refresh the page or complete setup.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEdit && id) {
        await updatePet(
          id,
          {
            name: form.name,
            species: form.species,
            breed: form.breed,
            birthDate: form.birthDate,
            notes: form.notes,
            photoUrl: form.photoUrl,
          },
          photoFile,
          user.id
        );
      } else {
        await createPet(
          household.id,
          {
            name: form.name,
            species: form.species,
            breed: form.breed,
            birthDate: form.birthDate,
            notes: form.notes,
            photoUrl: form.photoUrl,
          },
          photoFile,
          user.id
        );
      }

      navigate('/pets');
    } catch (err: any) {
      console.error('Error saving pet to Supabase:', err);
      setError(err.message || 'Failed to save pet to Supabase.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-xl py-12 text-center">
        <Loader2 className="w-8 h-8 text-sage-500 animate-spin mx-auto mb-3" />
        <p className="text-sage-600 text-sm">Loading pet details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <Link to="/pets" className="flex items-center gap-2 text-sage-500 hover:text-sage-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Pets
      </Link>

      <div className="flex items-center justify-between mb-2">
        <h1 className="section-title">{isEdit ? 'Edit Pet' : 'Add a New Pet'}</h1>
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
          <Cloud className="w-3 h-3" /> Supabase Cloud
        </span>
      </div>
      <p className="section-sub">
        {isEdit ? "Update your pet's information in Supabase." : 'Add a pet to your household.'}
      </p>

      {migrationNeeded && <MigrationBanner />}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Pet Name *</label>
          <input
            className="input"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Max"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Species *</label>
            <select className="input" value={form.species} onChange={set('species')}>
              {['Dog', 'Cat', 'Bird', 'Rabbit', 'Fish', 'Other'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Breed</label>
            <input
              className="input"
              value={form.breed}
              onChange={set('breed')}
              placeholder="e.g. Labrador Retriever"
            />
          </div>
        </div>

        <div>
          <label className="label">Date of Birth</label>
          <input
            className="input"
            type="date"
            value={form.birthDate}
            onChange={set('birthDate')}
          />
        </div>

        {/* Photo Upload & URL */}
        <div className="space-y-3">
          <label className="label">Pet Photo</label>

          <div className="border-2 border-dashed border-sage-200 rounded-xl p-4 text-center hover:border-sage-400 transition-colors bg-sage-50/30">
            <Upload className="w-6 h-6 text-sage-400 mx-auto mb-1.5" />
            <label className="text-xs font-semibold text-sage-600 hover:text-sage-800 cursor-pointer underline">
              <span>Upload photo file</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <div className="text-[11px] text-sage-400 mt-1">PNG, JPG, WEBP, or GIF up to 5 MB (Stored privately in Supabase)</div>
          </div>

          <div>
            <div className="text-xs text-sage-500 mb-1">Or enter an image web URL:</div>
            <input
              className="input text-xs"
              value={form.photoUrl}
              onChange={set('photoUrl')}
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          {photoPreview && (
            <div className="flex items-center gap-3 p-2 bg-sage-50 rounded-xl">
              <img
                src={photoPreview}
                alt="preview"
                className="w-16 h-16 rounded-xl object-cover border border-sage-200"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <div className="text-xs text-sage-600 flex-1 truncate">
                {photoFile ? photoFile.name : 'Image preview'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  setForm((f) => ({ ...f, photoUrl: '' }));
                }}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="label">Notes / Special Instructions</label>
          <textarea
            className="input"
            rows={3}
            value={form.notes}
            onChange={set('notes')}
            placeholder="Allergies, personality, feeding preferences..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving to Supabase...
              </>
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Add Pet to Household'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/pets')}
            className="btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PetProfiles() {
  const { household, migrationNeeded } = useAuth();
  const [pets, setPets] = useState<PetWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = useCallback(async () => {
    if (!household?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getPets(household.id);
      setPets(data);
    } catch (err: any) {
      console.error('Error fetching Supabase pets:', err);
      setError(err.message || 'Failed to load household pets from Supabase.');
    } finally {
      setLoading(false);
    }
  }, [household?.id]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deletePet(id);
      await fetchPets();
    } catch (err: any) {
      alert(`Error deleting pet: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="section-title">My Pets</h1>
          <p className="section-sub">Household: <strong>{household?.name || 'My Household'}</strong></p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPets}
            className="p-2 rounded-xl text-sage-400 hover:text-sage-700 hover:bg-sage-100 transition-colors"
            title="Refresh pets list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link to="/pets/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Pet
          </Link>
        </div>
      </div>

      {migrationNeeded && <MigrationBanner />}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold">Error loading pets</div>
            <p>{error}</p>
            <button onClick={fetchPets} className="underline font-semibold mt-1">Retry</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-sage-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-sage-600">Loading your pets from Supabase...</p>
        </div>
      ) : pets.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-sage-400 card border-dashed border-2 border-sage-200">
          <span className="text-5xl block mb-4">🐾</span>
          <p className="font-semibold text-sage-700 mb-1 text-base">
            You haven't added any pets yet
          </p>
          <p className="text-xs mb-5 text-sage-500 max-w-sm mx-auto">
            This account is empty and private. Add your first pet to start saving real records in your Supabase database.
          </p>
          <Link to="/pets/new" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4">
            <Plus className="w-4 h-4" /> Add Your First Pet
          </Link>
        </div>
      )}
    </div>
  );
}
