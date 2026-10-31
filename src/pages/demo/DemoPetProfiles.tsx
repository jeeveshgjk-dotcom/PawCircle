import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../../db/database';
import { useDemo } from '../../context/DemoContext';
import { Plus, ArrowLeft, Edit2, Trash2, Heart, Calendar, FileText, Sparkles } from 'lucide-react';
import type { Pet } from '../../types';

function PetCard({ pet, onDelete }: { pet: Pet; onDelete: (id: string) => void }) {
  const age = pet.birthDate
    ? Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="card-hover group relative">
      <div className="flex items-start gap-4">
        {pet.photoUrl
          ? <img src={pet.photoUrl} alt={pet.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
          : <div className="w-20 h-20 rounded-2xl bg-sage-100 flex items-center justify-center text-3xl flex-shrink-0">🐾</div>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sage-800 text-lg">{pet.name}</h3>
                <span className="badge-peach text-[10px]">Sample</span>
              </div>
              <div className="text-sm text-sage-500">{pet.breed}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge-green">{pet.species}</span>
                {age !== null && <span className="badge bg-sage-50 text-sage-600">{age} yr{age !== 1 ? 's' : ''} old</span>}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link to={`/demo/pets/${pet.id}/edit`} className="p-1.5 rounded-lg hover:bg-sage-100 text-sage-400 hover:text-sage-600 transition-colors">
                <Edit2 className="w-4 h-4" />
              </Link>
              <button onClick={() => onDelete(pet.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-sage-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {pet.notes && <p className="text-sm text-sage-500 mt-2 line-clamp-2">{pet.notes}</p>}
        </div>
      </div>
      <div className="flex gap-3 mt-4 pt-4 border-t border-sage-50">
        <Link to={`/demo/health?pet=${pet.id}`} className="flex items-center gap-1.5 text-xs text-sage-500 hover:text-sage-700">
          <Heart className="w-3.5 h-3.5" /> Health Records
        </Link>
        <Link to={`/demo/schedule?pet=${pet.id}`} className="flex items-center gap-1.5 text-xs text-sage-500 hover:text-sage-700">
          <Calendar className="w-3.5 h-3.5" /> Schedule
        </Link>
        <Link to={`/demo/capsule?pet=${pet.id}`} className="flex items-center gap-1.5 text-xs text-sage-500 hover:text-sage-700">
          <FileText className="w-3.5 h-3.5" /> Memories
        </Link>
      </div>
    </div>
  );
}

export function DemoPetForm() {
  const { householdId } = useDemo();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');

  const existing = useLiveQuery(async (): Promise<Pet | undefined> =>
    id && id !== 'new' ? db.pets.get(id) : undefined
  , [id]);

  const [form, setForm] = useState({
    name: '', species: 'Dog', breed: '', birthDate: '', notes: '', photoUrl: '',
  });
  const [initialised, setInitialised] = useState(false);

  if (existing && !initialised) {
    setForm({
      name: existing.name,
      species: existing.species,
      breed: existing.breed,
      birthDate: existing.birthDate ?? '',
      notes: existing.notes ?? '',
      photoUrl: existing.photoUrl ?? '',
    });
    setInitialised(true);
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    if (isEdit && existing) {
      await db.pets.update(existing.id, { ...form, updatedAt: now });
    } else {
      await db.pets.add({
        id: crypto.randomUUID(),
        householdId,
        ...form,
        createdAt: now,
        updatedAt: now,
      });
    }
    navigate('/demo/pets');
  };

  return (
    <div className="max-w-xl">
      <Link to="/demo/pets" className="flex items-center gap-2 text-sage-500 hover:text-sage-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Demo Pets
      </Link>
      <div className="flex items-center justify-between mb-1">
        <h1 className="section-title">{isEdit ? 'Edit Demo Pet' : 'Add Demo Pet'}</h1>
        <span className="badge-peach text-xs">Sandbox Only</span>
      </div>
      <p className="section-sub">{isEdit ? "Update sample pet information." : "Add a pet to the sample demo dataset."}</p>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Pet Name *</label>
          <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Bruno" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Species *</label>
            <select className="input" value={form.species} onChange={set('species')}>
              {['Dog', 'Cat', 'Bird', 'Rabbit', 'Fish', 'Other'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Breed</label>
            <input className="input" value={form.breed} onChange={set('breed')} placeholder="e.g. Golden Retriever" />
          </div>
        </div>
        <div>
          <label className="label">Date of Birth</label>
          <input className="input" type="date" value={form.birthDate} onChange={set('birthDate')} />
        </div>
        <div>
          <label className="label">Photo URL</label>
          <input className="input" value={form.photoUrl} onChange={set('photoUrl')} placeholder="https://..." />
          {form.photoUrl && <img src={form.photoUrl} alt="preview" className="mt-2 w-24 h-24 rounded-xl object-cover" onError={e => (e.currentTarget.style.display = 'none')} />}
        </div>
        <div>
          <label className="label">Notes / Special Instructions</label>
          <textarea className="input" rows={3} value={form.notes} onChange={set('notes')} placeholder="Allergies, personality, feeding preferences..." />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1">{isEdit ? 'Save Changes' : 'Add Pet'}</button>
          <button type="button" onClick={() => navigate('/demo/pets')} className="btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function DemoPetProfiles() {
  const { householdId } = useDemo();
  const pets = useLiveQuery(() => db.pets.where('householdId').equals(householdId).toArray(), [householdId]);

  const handleDelete = async (id: string) => {
    if (confirm('Remove this demo pet? You can always reset the demo to restore it.')) {
      await db.pets.delete(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="section-title">Demo Pets</h1>
          <p className="section-sub">Fictional pet profiles stored in your browser's local sandbox.</p>
        </div>
        <Link to="/demo/pets/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Demo Pet
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {pets?.map(pet => <PetCard key={pet.id} pet={pet} onDelete={handleDelete} />)}
      </div>

      <div className="mt-8 p-4 bg-peach-50 rounded-2xl border border-peach-200 text-center">
        <p className="text-xs text-peach-700 font-medium mb-2">
          Want to manage your own real pets with cloud storage and private photos?
        </p>
        <Link to="/signup" className="btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-4">
          <Sparkles className="w-3.5 h-3.5" /> Create a Real Account
        </Link>
      </div>
    </div>
  );
}

