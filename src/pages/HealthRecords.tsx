import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useApp } from '../context/AppContext';
import { Plus, Heart, Calendar, Trash2, AlertCircle } from 'lucide-react';
import type { CareRecordType } from '../types';

const TYPES: { value: CareRecordType; label: string; emoji: string }[] = [
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

export default function HealthRecords() {
  const { householdId } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedPet, setSelectedPet] = useState('');
  const [form, setForm] = useState({
    petId: '', type: 'vaccination' as CareRecordType,
    title: '', eventDate: '', nextDueDate: '', notes: '', provider: '',
  });

  const pets = useLiveQuery(() => db.pets.where('householdId').equals(householdId).toArray(), [householdId]);
  const records = useLiveQuery(() =>
    selectedPet
      ? db.careRecords.where('petId').equals(selectedPet).reverse().toArray()
      : db.careRecords.reverse().toArray()
  , [selectedPet]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    await db.careRecords.add({
      id: crypto.randomUUID(),
      petId: form.petId,
      type: form.type,
      title: form.title,
      eventDate: form.eventDate,
      nextDueDate: form.nextDueDate || undefined,
      notes: form.notes || undefined,
      provider: form.provider || undefined,
      createdAt: now,
      updatedAt: now,
    });
    setShowForm(false);
    setForm({ petId: '', type: 'vaccination', title: '', eventDate: '', nextDueDate: '', notes: '', provider: '' });
  };

  const upcomingDue = records?.filter(r => isDueSoon(r.nextDueDate) || isOverdue(r.nextDueDate)) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Health Records</h1>
          <p className="section-sub">Track vaccinations, vet visits, grooming, and medication.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {/* Due Soon Alerts */}
      {upcomingDue.length > 0 && (
        <div className="mb-6 space-y-2">
          {upcomingDue.map(r => {
            const pet = pets?.find(p => p.id === r.petId);
            const overdue = isOverdue(r.nextDueDate);
            return (
              <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border ${overdue ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 ${overdue ? 'text-red-500' : 'text-yellow-500'}`} />
                <div className="text-sm">
                  <span className={`font-semibold ${overdue ? 'text-red-700' : 'text-yellow-700'}`}>{overdue ? 'Overdue: ' : 'Due Soon: '}</span>
                  <span className="text-sage-700">{r.title}</span>
                  <span className="text-sage-400"> · {pet?.name} · {r.nextDueDate && new Date(r.nextDueDate).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
          <h3 className="font-semibold text-sage-800">New Health Record</h3>
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
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Rabies Vaccine" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" value={form.eventDate} onChange={set('eventDate')} required />
            </div>
            <div>
              <label className="label">Next Due Date</label>
              <input className="input" type="date" value={form.nextDueDate} onChange={set('nextDueDate')} />
            </div>
          </div>
          <div>
            <label className="label">Provider / Clinic</label>
            <input className="input" value={form.provider} onChange={set('provider')} placeholder="e.g. Dr. Arjun — PetCare Clinic" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} placeholder="Any additional notes…" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary flex-1">Save Record</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      {/* Pet Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setSelectedPet('')} className={`btn-ghost text-sm py-1.5 ${!selectedPet ? 'bg-sage-100 font-semibold' : ''}`}>All Pets</button>
        {pets?.map(p => (
          <button key={p.id} onClick={() => setSelectedPet(p.id)} className={`btn-ghost text-sm py-1.5 flex items-center gap-1.5 ${selectedPet === p.id ? 'bg-sage-100 font-semibold' : ''}`}>
            {p.photoUrl && <img src={p.photoUrl} alt={p.name} className="w-5 h-5 rounded-full object-cover" />}
            {p.name}
          </button>
        ))}
      </div>

      {/* Records */}
      <div className="space-y-3">
        {records?.map(record => {
          const pet = pets?.find(p => p.id === record.petId);
          const typeInfo = TYPES.find(t => t.value === record.type);
          const overdue = isOverdue(record.nextDueDate);
          const dueSoon = isDueSoon(record.nextDueDate);
          return (
            <div key={record.id} className="card group relative">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-xl flex-shrink-0">
                  {typeInfo?.emoji ?? '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-semibold text-sage-800">{record.title}</div>
                      <div className="text-sm text-sage-500">{pet?.name} · {typeInfo?.label}</div>
                    </div>
                    <button onClick={async () => {
                      if (confirm('Delete this record?')) await db.careRecords.delete(record.id);
                    }} className="p-1.5 rounded-lg text-sage-200 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-sage-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                      {new Date(record.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {record.provider && <span>🏥 {record.provider}</span>}
                  </div>
                  {record.notes && <p className="text-sm text-sage-500 mt-1.5">{record.notes}</p>}
                  {record.nextDueDate && (
                    <div className={`mt-2 text-xs font-medium ${overdue ? 'text-red-500' : dueSoon ? 'text-yellow-600' : 'text-sage-400'}`}>
                      {overdue ? '🔴 Overdue: ' : dueSoon ? '🟡 Due soon: ' : '📅 Next due: '}
                      {new Date(record.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {!records?.length && (
          <div className="text-center py-14 text-sage-400">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-sage-600">No health records yet</p>
            <p className="text-sm mt-1">Add your first record above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

