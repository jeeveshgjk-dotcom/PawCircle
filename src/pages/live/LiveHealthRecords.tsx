import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPets, type PetWithPhoto } from '../../services/petService';
import {
  getLiveHealthRecords,
  createLiveHealthRecord,
  deleteLiveHealthRecord,
  type LiveCareRecord
} from '../../services/liveDataService';
import { Plus, Heart, Calendar, Trash2, AlertCircle, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPES: { value: LiveCareRecord['type']; label: string; emoji: string }[] = [
  { value: 'vaccination', label: 'Vaccination', emoji: '💉' },
  { value: 'grooming', label: 'Grooming', emoji: '✂️' },
  { value: 'vet_visit', label: 'Vet Visit', emoji: '🏥' },
  { value: 'medication', label: 'Medication', emoji: '💊' },
  { value: 'other', label: 'Other', emoji: '📋' },
];

function isDueSoon(dateStr?: string) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const daysUntil = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysUntil <= 30 && daysUntil >= 0;
}

function isOverdue(dateStr?: string) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function LiveHealthRecords() {
  const { user, household } = useAuth();
  const [pets, setPets] = useState<PetWithPhoto[]>([]);
  const [records, setRecords] = useState<LiveCareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<string>('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pet_id: '',
    type: 'vaccination' as LiveCareRecord['type'],
    title: '',
    event_date: '',
    next_due_date: '',
    notes: '',
    provider: '',
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
      const recs = await getLiveHealthRecords(petIds);
      setRecords(recs);
      if (p.length > 0 && !form.pet_id) {
        setForm(prev => ({ ...prev, pet_id: p[0].id }));
      }
    } catch (err) {
      console.error('Error loading health records:', err);
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
    setForm(prev => ({ ...prev, [k]: e.target.value }));
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
      await createLiveHealthRecord({
        pet_id: form.pet_id,
        type: form.type,
        title: form.title,
        event_date: form.event_date,
        next_due_date: form.next_due_date || undefined,
        notes: form.notes || undefined,
        provider: form.provider || undefined,
      });
      setShowForm(false);
      setForm(prev => ({
        ...prev,
        title: '',
        event_date: '',
        next_due_date: '',
        notes: '',
        provider: '',
      }));
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save health record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!user?.id) return;
    if (window.confirm('Delete this health record?')) {
      await deleteLiveHealthRecord(recordId);
      loadData();
    }
  };

  const filteredRecords = selectedPet
    ? records.filter(r => r.pet_id === selectedPet)
    : records;

  const dueSoonRecords = records.filter(
    r => isDueSoon(r.next_due_date) || isOverdue(r.next_due_date)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Pet Health Records</h1>
          <p className="section-sub">
            Track vaccinations, vet visits, medications, and upcoming booster dates.
          </p>
        </div>
        {pets.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Record
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
            Add your pet first before logging health records and vaccinations.
          </p>
          <Link to="/pets/new" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4">
            <Plus className="w-4 h-4" /> Add a Pet
          </Link>
        </div>
      )}

      {/* Due Soon / Overdue Alerts */}
      {dueSoonRecords.length > 0 && (
        <div className="mb-6 space-y-2">
          {dueSoonRecords.map(r => {
            const pet = pets.find(p => p.id === r.pet_id);
            const overdue = isOverdue(r.next_due_date);
            return (
              <div
                key={r.id}
                className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
                  overdue
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                }`}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1">
                  <strong>{overdue ? 'Overdue Due Date' : 'Upcoming Due Date'}:</strong>{' '}
                  {pet?.name} • {r.title} (due {r.next_due_date})
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
          <h3 className="font-semibold text-sage-800">New Health Record</h3>
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
              <label className="label">Record Type *</label>
              <select
                className="input"
                value={form.type}
                onChange={handleChange('type')}
                required
              >
                {TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.emoji} {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Record Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={handleChange('title')}
                placeholder="e.g. Rabies Annual Booster"
                required
              />
            </div>
            <div>
              <label className="label">Clinic / Provider (optional)</label>
              <input
                className="input"
                value={form.provider}
                onChange={handleChange('provider')}
                placeholder="e.g. Happy Paws Vet Clinic"
              />
            </div>
            <div>
              <label className="label">Date Performed *</label>
              <input
                className="input"
                type="date"
                value={form.event_date}
                onChange={handleChange('event_date')}
                required
              />
            </div>
            <div>
              <label className="label">Next Due Date (optional)</label>
              <input
                className="input"
                type="date"
                value={form.next_due_date}
                onChange={handleChange('next_due_date')}
              />
            </div>
          </div>
          <div>
            <label className="label">Notes / Batch Number (optional)</label>
            <textarea
              className="input"
              rows={2}
              value={form.notes}
              onChange={handleChange('notes')}
              placeholder="e.g. Administered sub-Q, no adverse reaction observed."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary text-xs py-2 px-4">
              {submitting ? 'Saving...' : 'Save Health Record'}
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

      {/* Records List */}
      {loading ? (
        <div className="py-12 text-center text-sage-500">Loading health records...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-16 text-sage-400 card border-dashed">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-40 text-sage-500" />
          <p className="font-semibold text-sage-700 mb-1">No health records logged</p>
          <p className="text-xs text-sage-500 mb-5 max-w-sm mx-auto">
            Log vaccinations, vet appointments, and medications to keep a digital health history.
          </p>
          {pets.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4"
            >
              <Plus className="w-4 h-4" /> Add First Record
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map(r => {
            const pet = pets.find(p => p.id === r.pet_id);
            const typeObj = TYPES.find(t => t.value === r.type);
            return (
              <div
                key={r.id}
                className="card flex items-start justify-between gap-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl p-2 bg-sage-50 rounded-xl flex-shrink-0">
                    {typeObj?.emoji || '📋'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sage-800 text-sm">{r.title}</h3>
                    <div className="text-xs text-sage-500 mt-0.5">
                      {pet?.name} · {typeObj?.label} {r.provider ? `· ${r.provider}` : ''}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-sage-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Performed: {r.event_date}
                      </span>
                      {r.next_due_date && (
                        <span className="flex items-center gap-1 font-medium text-sage-700">
                          Next Due: {r.next_due_date}
                        </span>
                      )}
                    </div>
                    {r.notes && (
                      <p className="text-xs text-sage-600 mt-2 bg-sage-50/60 p-2 rounded-lg">
                        {r.notes}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-sage-300 hover:text-red-600 p-1 rounded-lg transition-colors"
                  title="Delete record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

