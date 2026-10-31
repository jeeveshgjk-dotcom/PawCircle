import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPets, type PetWithPhoto } from '../../services/petService';
import {
  getLiveMemories,
  createLiveMemory,
  deleteLiveMemory,
  type LiveMemory
} from '../../services/liveDataService';
import { Plus, Camera, Star, Trash2, Heart, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LiveTimeCapsule() {
  const { user, household } = useAuth();
  const [pets, setPets] = useState<PetWithPhoto[]>([]);
  const [memories, setMemories] = useState<LiveMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<string>('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pet_id: '',
    title: '',
    caption: '',
    occurred_at: '',
    photo_url: '',
    milestone: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id || !household?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const p = await getPets(household.id);
      setPets(p);
      const petIds = p.map(pet => pet.id);
      const mems = await getLiveMemories(petIds);
      setMemories(mems);
      if (p.length > 0 && !form.pet_id) {
        setForm(prev => ({ ...prev, pet_id: p[0].id }));
      }
    } catch (err) {
      console.error('Error loading time capsule:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, household?.id, form.pet_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({
      ...prev,
      [k]: k === 'milestone' ? (e.target as HTMLInputElement).checked : e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !form.pet_id) {
      setError('Please select a pet.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createLiveMemory({
        pet_id: form.pet_id,
        title: form.title,
        caption: form.caption,
        occurred_at: form.occurred_at || new Date().toISOString().split('T')[0],
        photo_url: form.photo_url || undefined,
        milestone: form.milestone,
      });
      setShowForm(false);
      setForm(prev => ({
        ...prev,
        title: '',
        caption: '',
        occurred_at: '',
        photo_url: '',
        milestone: false,
      }));
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save memory.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (memoryId: string) => {
    if (!user?.id) return;
    if (window.confirm('Delete this memory?')) {
      await deleteLiveMemory(memoryId);
      loadData();
    }
  };

  const filteredMemories = selectedPet
    ? memories.filter(m => m.pet_id === selectedPet)
    : memories;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">🐾 Time Capsule</h1>
          <p className="section-sub">
            Preserve your pet's milestones, memories, and photos over the years.
          </p>
        </div>
        {pets.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Memory
          </button>
        )}
      </div>

      {pets.length === 0 && !loading && (
        <div className="card text-center py-12 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center mx-auto mb-3 text-2xl">
            🐾
          </div>
          <h3 className="font-bold text-sage-800 text-sm mb-1">No Pets Added Yet</h3>
          <p className="text-xs text-sage-500 max-w-sm mx-auto mb-4">
            Add your pet first before recording milestones in the time capsule.
          </p>
          <Link to="/pets/new" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4">
            <Plus className="w-4 h-4" /> Add a Pet
          </Link>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
          <h3 className="font-semibold text-sage-800">Add a Memory</h3>
          {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Pet *</label>
              <select
                className="input"
                value={form.pet_id}
                onChange={handleChange('pet_id')}
                required
              >
                {pets.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input
                className="input"
                type="date"
                value={form.occurred_at}
                onChange={handleChange('occurred_at')}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              value={form.title}
              onChange={handleChange('title')}
              placeholder="e.g. First beach trip or 1st Birthday"
              required
            />
          </div>
          <div>
            <label className="label">Caption / Memory Story *</label>
            <textarea
              className="input"
              rows={3}
              value={form.caption}
              onChange={handleChange('caption')}
              placeholder="What happened? What made this moment unforgettable?"
              required
            />
          </div>
          <div>
            <label className="label">Photo Web URL (optional)</label>
            <input
              className="input"
              value={form.photo_url}
              onChange={handleChange('photo_url')}
              placeholder="https://images.unsplash.com/..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="milestone"
              checked={form.milestone}
              onChange={handleChange('milestone')}
              className="rounded text-sage-600 focus:ring-sage-500 h-4 w-4"
            />
            <label htmlFor="milestone" className="text-xs font-semibold text-sage-700 cursor-pointer">
              ⭐ Mark as a major milestone (e.g. Gotcha Day, birthday, adoption)
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary text-xs py-2 px-4">
              {submitting ? 'Saving...' : 'Save Memory'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-outline text-xs py-2 px-4"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter by Pet */}
      {pets.length > 1 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <span className="text-xs text-sage-500 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            onClick={() => setSelectedPet('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              !selectedPet
                ? 'bg-sage-600 text-white'
                : 'bg-sage-100 text-sage-600 hover:bg-sage-200'
            }`}
          >
            All Pets
          </button>
          {pets.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPet(p.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedPet === p.id
                  ? 'bg-sage-600 text-white'
                  : 'bg-sage-100 text-sage-600 hover:bg-sage-200'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Memories Grid */}
      {loading ? (
        <div className="py-12 text-center text-sage-500">Loading memories...</div>
      ) : filteredMemories.length === 0 ? (
        <div className="text-center py-16 text-sage-400 card border-dashed">
          <Camera className="w-10 h-10 mx-auto mb-3 opacity-40 text-sage-500" />
          <p className="font-semibold text-sage-700 mb-1">No memories captured yet</p>
          <p className="text-xs text-sage-500 mb-5 max-w-sm mx-auto">
            Store special photos, adoption days, puppy days, and funny memories in your pet's personal time capsule.
          </p>
          {pets.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4"
            >
              <Plus className="w-4 h-4" /> Add First Memory
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredMemories.map(m => {
            const pet = pets.find(p => p.id === m.pet_id);
            return (
              <div
                key={m.id}
                className="card flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {m.milestone && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Milestone
                  </div>
                )}
                <div>
                  {m.photo_url && (
                    <img
                      src={m.photo_url}
                      alt={m.title}
                      className="w-full h-48 object-cover rounded-xl mb-3"
                    />
                  )}
                  <h3 className="font-bold text-sage-800 text-sm">{m.title}</h3>
                  <div className="text-[11px] text-sage-400 mb-2">
                    {pet?.name} • {new Date(m.occurred_at).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-sage-600 leading-relaxed">{m.caption}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-sage-100 flex items-center justify-between text-xs">
                  <span className="text-sage-400">Captured in PawCircle</span>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-sage-300 hover:text-red-600 transition-colors"
                    title="Delete memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

