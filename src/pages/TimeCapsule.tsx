import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useApp } from '../context/AppContext';
import { Plus, Camera, Star, Trash2, Heart } from 'lucide-react';

export default function TimeCapsule() {
  const { householdId } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedPet, setSelectedPet] = useState('');
  const [form, setForm] = useState({ petId: '', title: '', caption: '', occurredAt: '', photoUrl: '', milestone: false });

  const pets = useLiveQuery(() => db.pets.where('householdId').equals(householdId).toArray(), [householdId]);
  const memories = useLiveQuery(() =>
    selectedPet
      ? db.memories.where('petId').equals(selectedPet).reverse().toArray()
      : db.memories.reverse().toArray()
  , [selectedPet]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: k === 'milestone' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    await db.memories.add({
      id: crypto.randomUUID(),
      petId: form.petId,
      title: form.title,
      caption: form.caption,
      occurredAt: form.occurredAt || now,
      photoUrl: form.photoUrl || undefined,
      milestone: form.milestone,
      createdAt: now,
      updatedAt: now,
    });
    setShowForm(false);
    setForm({ petId: '', title: '', caption: '', occurredAt: '', photoUrl: '', milestone: false });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">🐾 Time Capsule</h1>
          <p className="section-sub">Preserve your pets' best moments and milestones forever.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Memory
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
          <h3 className="font-semibold text-sage-800">Add a Memory</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Pet *</label>
              <select className="input" value={form.petId} onChange={set('petId')} required>
                <option value="">Select pet…</option>
                {pets?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.occurredAt} onChange={set('occurredAt')} />
            </div>
          </div>
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. First Beach Trip" required />
          </div>
          <div>
            <label className="label">Caption *</label>
            <textarea className="input" rows={3} value={form.caption} onChange={set('caption')} placeholder="Describe this moment…" required />
          </div>
          <div>
            <label className="label">Photo URL</label>
            <input className="input" value={form.photoUrl} onChange={set('photoUrl')} placeholder="https://…" />
            {form.photoUrl && <img src={form.photoUrl} alt="preview" className="mt-2 h-32 rounded-xl object-cover" onError={e => (e.currentTarget.style.display = 'none')} />}
          </div>
          <label className="flex items-center gap-2 text-sm text-sage-700 cursor-pointer">
            <input type="checkbox" checked={form.milestone} onChange={set('milestone')} className="rounded" />
            <Star className="w-4 h-4 text-yellow-500" /> Mark as milestone
          </label>
          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary flex-1">Save Memory</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      {/* Pet Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setSelectedPet('')} className={`btn-ghost text-sm py-1.5 ${!selectedPet ? 'bg-sage-100 font-semibold' : ''}`}>All Pets</button>
        {pets?.map(p => (
          <button key={p.id} onClick={() => setSelectedPet(p.id)} className={`btn-ghost text-sm py-1.5 flex items-center gap-1.5 ${selectedPet === p.id ? 'bg-sage-100 font-semibold' : ''}`}>
            {p.photoUrl && <img src={p.photoUrl} alt={p.name} className="w-5 h-5 rounded-full object-cover" />}
            {p.name}
          </button>
        ))}
      </div>

      {/* Memory Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5">
        {memories?.map(memory => {
          const pet = pets?.find(p => p.id === memory.petId);
          return (
            <div key={memory.id} className="card group overflow-hidden p-0">
              {memory.photoUrl && (
                <img src={memory.photoUrl} alt={memory.title} className="w-full h-48 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sage-800">{memory.title}</h3>
                      {memory.milestone && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                    </div>
                    <div className="text-xs text-sage-400 mt-0.5">
                      {pet?.name} · {new Date(memory.occurredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <button onClick={async () => {
                    if (confirm('Delete this memory?')) await db.memories.delete(memory.id);
                  }} className="p-1.5 rounded-lg text-sage-200 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-sage-600 leading-relaxed">{memory.caption}</p>
                {memory.linkedCompletionId && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-sage-400">
                    <Heart className="w-3 h-3 text-peach-400" /> Linked care memory
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!memories?.length && (
        <div className="text-center py-14 text-sage-400">
          <Camera className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-sage-600">No memories yet</p>
          <p className="text-sm mt-1">Start capturing your pets' best moments!</p>
        </div>
      )}
    </div>
  );
}

