import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useApp } from '../context/AppContext';
import { Plus, CheckCircle, Clock, Calendar, Trash2 } from 'lucide-react';

const TYPES = ['feeding', 'walking', 'grooming', 'play', 'medication', 'vet', 'other'] as const;
const typeEmoji: Record<string, string> = {
  feeding: '🍖', walking: '🦮', grooming: '✂️', play: '🎾', medication: '💊', vet: '🏥', other: '📋',
};

export default function Schedule() {
  const { householdId, role, caretakerId } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ petId: '', title: '', type: 'feeding', time: '08:00', recurrence: 'daily', assignedMemberId: '' });

  const pets = useLiveQuery(() => db.pets.where('householdId').equals(householdId).toArray(), [householdId]);
  const familyMembers = useLiveQuery(() => db.familyMembers.where('householdId').equals(householdId).toArray(), [householdId]);
  const routines = useLiveQuery(() => db.routines.where('active').equals(1).toArray(), []);

  // For caretaker: only tasks assigned to them
  const tasks = useLiveQuery(() =>
    role === 'caretaker'
      ? db.careTasks.filter(t => t.status !== 'skipped').toArray()
      : db.careTasks.toArray()
  , [role]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const addRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    await db.routines.add({
      id: crypto.randomUUID(),
      petId: form.petId,
      title: form.title,
      type: form.type as any,
      time: form.time,
      recurrence: form.recurrence,
      assignedMemberId: form.assignedMemberId || undefined,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    setShowForm(false);
    setForm({ petId: '', title: '', type: 'feeding', time: '08:00', recurrence: 'daily', assignedMemberId: '' });
  };

  const markTaskDone = async (taskId: string) => {
    const now = new Date().toISOString();
    const notes = prompt('Completion note (optional):') ?? '';
    await db.careTasks.update(taskId, { status: 'completed', completedAt: now, notes, updatedAt: now });
  };

  const todayTasks = tasks?.filter(t => {
    const due = new Date(t.dueAt);
    const now = new Date();
    return due.toDateString() === now.toDateString() || due < now;
  });

  const pendingToday = todayTasks?.filter(t => t.status === 'pending') ?? [];
  const completedToday = todayTasks?.filter(t => t.status === 'completed') ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Care Schedule</h1>
          <p className="section-sub">Daily routines, tasks, and upcoming care activities.</p>
        </div>
        {role === 'owner' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Routine
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={addRoutine} className="card mb-6 space-y-4">
          <h3 className="font-semibold text-sage-800">New Routine</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Pet *</label>
              <select className="input" value={form.petId} onChange={set('petId')} required>
                <option value="">Select pet…</option>
                {pets?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type *</label>
              <select className="input" value={form.type} onChange={set('type')}>
                {TYPES.map(t => <option key={t} value={t}>{typeEmoji[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Morning Walk" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Time *</label>
              <input className="input" type="time" value={form.time} onChange={set('time')} required />
            </div>
            <div>
              <label className="label">Recurrence</label>
              <select className="input" value={form.recurrence} onChange={set('recurrence')}>
                {['daily', 'weekdays', 'weekends', 'weekly', 'monthly'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Assign to</label>
            <select className="input" value={form.assignedMemberId} onChange={set('assignedMemberId')}>
              <option value="">Unassigned</option>
              {familyMembers?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary flex-1">Add Routine</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="card">
          <h2 className="font-semibold text-sage-800 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Today's Tasks
            {pendingToday.length > 0 && <span className="badge-yellow ml-auto">{pendingToday.length} pending</span>}
          </h2>

          {pendingToday.length === 0 && completedToday.length === 0 && (
            <div className="text-center py-8 text-sage-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No tasks for today.</p>
            </div>
          )}

          <div className="space-y-2">
            {pendingToday.map(task => {
              const pet = pets?.find(p => p.id === task.petId);
              return (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-sm flex-shrink-0">
                    {pet?.name?.[0] ?? '🐾'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-sage-800">{task.title}</div>
                    <div className="text-xs text-sage-400">{pet?.name}</div>
                  </div>
                  <button onClick={() => markTaskDone(task.id)} className="btn-primary text-xs py-1 px-3 flex-shrink-0">Done</button>
                </div>
              );
            })}
            {completedToday.map(task => {
              const pet = pets?.find(p => p.id === task.petId);
              return (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl opacity-70">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-through text-sage-400">{task.title}</div>
                    <div className="text-xs text-sage-400">{pet?.name} {task.notes && `· ${task.notes}`}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Routines */}
        <div className="card">
          <h2 className="font-semibold text-sage-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recurring Routines
          </h2>
          <div className="space-y-2">
            {routines?.map(routine => {
              const pet = pets?.find(p => p.id === routine.petId);
              const member = familyMembers?.find(m => m.id === routine.assignedMemberId);
              return (
                <div key={routine.id} className="flex items-center gap-3 p-3 bg-sage-50 rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-sage-100 flex items-center justify-center text-lg flex-shrink-0">
                    {typeEmoji[routine.type] ?? '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-sage-800">{routine.title}</div>
                    <div className="text-xs text-sage-400">
                      {pet?.name} · {routine.time} · {routine.recurrence}
                      {member && ` · ${member.name}`}
                    </div>
                  </div>
                  {role === 'owner' && (
                    <button onClick={async () => {
                      if (confirm('Remove this routine?')) await db.routines.update(routine.id, { active: false, updatedAt: new Date().toISOString() });
                    }} className="p-1.5 rounded-lg text-sage-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            {!routines?.length && (
              <div className="text-center py-6 text-sage-400 text-sm">No routines yet. Add recurring care tasks above.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

