import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPets, type PetWithPhoto } from '../../services/petService';
import {
  getLiveRoutines,
  createLiveRoutine,
  deleteLiveRoutine,
  getLiveCareTasks,
  completeLiveTask,
  type LiveRoutine,
  type LiveCareTask
} from '../../services/liveDataService';
import { Plus, CheckCircle, Clock, Calendar, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPES = ['feeding', 'walking', 'grooming', 'play', 'medication', 'vet', 'other'] as const;
const typeEmoji: Record<string, string> = {
  feeding: '🍖',
  walking: '🦮',
  grooming: '✂️',
  play: '🎾',
  medication: '💊',
  vet: '🏥',
  other: '📋',
};

export default function LiveSchedule() {
  const { user, profile, household } = useAuth();
  const [pets, setPets] = useState<PetWithPhoto[]>([]);
  const [routines, setRoutines] = useState<LiveRoutine[]>([]);
  const [tasks, setTasks] = useState<LiveCareTask[]>([]);
  const [loading, setLoading] = useState(true);

  const isCaretaker = profile?.role === 'caretaker';

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pet_id: '',
    title: '',
    type: 'feeding' as LiveRoutine['type'],
    time: '08:00',
    recurrence: 'daily',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (isCaretaker) {
        // Load assigned tasks for caretaker
        const assignedTasks = await getLiveCareTasks(undefined, user.id);
        setTasks(assignedTasks);
      } else if (household?.id) {
        // Load household pets, routines, and tasks
        const [p, r, t] = await Promise.all([
          getPets(household.id),
          getLiveRoutines(household.id),
          getLiveCareTasks(household.id),
        ]);
        setPets(p);
        setRoutines(r);
        setTasks(t);
        if (p.length > 0 && !form.pet_id) {
          setForm(prev => ({ ...prev, pet_id: p[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading schedule data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, household?.id, isCaretaker, form.pet_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
  };

  const handleAddRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!household?.id) return;
    if (!form.pet_id) {
      setError('Please select a pet.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createLiveRoutine(household.id, {
        pet_id: form.pet_id,
        title: form.title,
        type: form.type,
        time: form.time,
        recurrence: form.recurrence,
      });
      setShowForm(false);
      setForm(prev => ({ ...prev, title: '' }));
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add routine.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const notes = window.prompt('Completion note (optional):') || undefined;
    await completeLiveTask(taskId, notes);
    loadData();
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (window.confirm('Are you sure you want to delete this routine?')) {
      await deleteLiveRoutine(routineId);
      loadData();
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="section-title">
            {isCaretaker ? 'My Care Schedule' : 'Care Schedule & Routines'}
          </h1>
          <p className="section-sub">
            {isCaretaker
              ? 'View and complete care tasks for your active pet assignments.'
              : 'Track daily feedings, walks, medications, and recurring care for your pets.'}
          </p>
        </div>
        {!isCaretaker && pets.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Routine
          </button>
        )}
      </div>

      {!isCaretaker && pets.length === 0 && !loading && (
        <div className="card text-center py-12 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center mx-auto mb-3 text-2xl">
            🐾
          </div>
          <h3 className="font-bold text-sage-800 text-sm mb-1">No Pets Added Yet</h3>
          <p className="text-xs text-sage-500 max-w-sm mx-auto mb-4">
            Add your pet first before setting up routines and daily schedules.
          </p>
          <Link to="/pets/new" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4">
            <Plus className="w-4 h-4" /> Add a Pet
          </Link>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddRoutine} className="card mb-6 space-y-4">
          <h3 className="font-semibold text-sage-800">Add Recurring Routine</h3>
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
              <label className="label">Routine Type *</label>
              <select
                className="input"
                value={form.type}
                onChange={handleChange('type')}
                required
              >
                {TYPES.map(t => (
                  <option key={t} value={t}>
                    {typeEmoji[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={handleChange('title')}
                placeholder="e.g. Morning Dry Food & Fresh Water"
                required
              />
            </div>
            <div>
              <label className="label">Time *</label>
              <input
                className="input"
                type="time"
                value={form.time}
                onChange={handleChange('time')}
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary text-xs py-2 px-4">
              {submitting ? 'Saving...' : 'Save Routine'}
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

      <div className={`grid ${isCaretaker ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
        {/* Left Column (or full width for Caretaker): Active Daily Tasks */}
        <div className={`${isCaretaker ? 'col-span-1' : 'lg:col-span-2'} space-y-6`}>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sage-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sage-600" /> Pending Care Tasks
                <span className="badge-yellow text-xs">{pendingTasks.length}</span>
              </h2>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-sage-500">Loading schedule...</div>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-sage-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-green-500" />
                <p className="text-sm font-medium text-sage-600">All caught up!</p>
                <p className="text-xs text-sage-400">
                  {isCaretaker
                    ? 'No pending tasks assigned to you right now.'
                    : routines.length === 0
                    ? 'No routines set up yet. Add a routine to generate daily tasks.'
                    : 'No pending tasks for today.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map(t => {
                  const pet = pets.find(p => p.id === t.pet_id);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-sage-100 hover:bg-sage-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCompleteTask(t.id)}
                          className="w-5 h-5 rounded-full border-2 border-sage-300 hover:border-green-500 flex items-center justify-center transition-colors"
                          title="Mark task completed"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-transparent hover:text-green-500" />
                        </button>
                        <div>
                          <div className="text-sm font-semibold text-sage-800">{t.title}</div>
                          <div className="text-xs text-sage-500">
                            {pet ? `${pet.name} · ` : ''}
                            Due: {new Date(t.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCompleteTask(t.id)}
                        className="text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-200 transition-colors"
                      >
                        Done ✓
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-sage-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" /> Completed Care
                <span className="badge-green text-xs">{completedTasks.length}</span>
              </h2>
              <div className="space-y-2">
                {completedTasks.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-sage-50/40 text-xs text-sage-600"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="line-through">{t.title}</span>
                    </div>
                    {t.notes && <span className="text-sage-400 italic">"{t.notes}"</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (for Pet Owners): Recurring Routines list */}
        {!isCaretaker && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold text-sage-800 text-sm mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sage-600" /> Active Household Routines
              </h3>
              {routines.length === 0 ? (
                <p className="text-xs text-sage-400">
                  No recurring routines added yet. Create one above to track daily care automatically.
                </p>
              ) : (
                <div className="space-y-2">
                  {routines.map(r => {
                    const pet = pets.find(p => p.id === r.pet_id);
                    return (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-sage-50/60 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-sage-800 flex items-center gap-1.5">
                            <span>{typeEmoji[r.type] || '📋'}</span>
                            {r.title}
                          </div>
                          <div className="text-sage-500 mt-0.5">
                            {pet?.name} · {r.time} ({r.recurrence})
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRoutine(r.id)}
                          className="text-sage-400 hover:text-red-600 p-1 rounded-lg"
                          title="Delete routine"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
