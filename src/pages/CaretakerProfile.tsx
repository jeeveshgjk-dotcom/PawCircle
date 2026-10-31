import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useApp } from '../context/AppContext';
import { Save, UserCircle, Star, Edit2 } from 'lucide-react';

export default function CaretakerProfile() {
  const { caretakerId } = useApp();
  const caretaker = useLiveQuery(() => db.caretakerProfiles.get(caretakerId), [caretakerId]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: '', bio: '', experienceYears: '', skills: '', availability: '', photoUrl: '' });
  const [init, setInit] = useState(false);

  if (caretaker && !init) {
    setForm({
      displayName: caretaker.displayName,
      bio: caretaker.bio,
      experienceYears: String(caretaker.experienceYears ?? ''),
      skills: caretaker.skills.join(', '),
      availability: caretaker.availability ?? '',
      photoUrl: caretaker.photoUrl ?? '',
    });
    setInit(true);
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    await db.caretakerProfiles.update(caretakerId, {
      displayName: form.displayName,
      bio: form.bio,
      experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      availability: form.availability,
      photoUrl: form.photoUrl,
      updatedAt: now,
    });
    setEditing(false);
  };

  if (!caretaker) return <div className="text-sage-400 text-center py-10">Loading profile…</div>;

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">My Profile</h1>
          <p className="section-sub">Your caretaker profile seen by pet owners.</p>
        </div>
        <button onClick={() => setEditing(!editing)} className="btn-outline flex items-center gap-2">
          <Edit2 className="w-4 h-4" /> {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="card space-y-4">
          <div>
            <label className="label">Display Name</label>
            <input className="input" value={form.displayName} onChange={set('displayName')} />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input" rows={3} value={form.bio} onChange={set('bio')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Years of Experience</label>
              <input className="input" type="number" min="0" value={form.experienceYears} onChange={set('experienceYears')} />
            </div>
            <div>
              <label className="label">Availability</label>
              <input className="input" value={form.availability} onChange={set('availability')} placeholder="e.g. Weekends" />
            </div>
          </div>
          <div>
            <label className="label">Skills (comma-separated)</label>
            <input className="input" value={form.skills} onChange={set('skills')} />
          </div>
          <div>
            <label className="label">Photo URL</label>
            <input className="input" value={form.photoUrl} onChange={set('photoUrl')} />
          </div>
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Save Profile
          </button>
        </form>
      ) : (
        <div className="card">
          <div className="flex items-center gap-4 mb-5">
            {caretaker.photoUrl
              ? <img src={caretaker.photoUrl} alt={caretaker.displayName} className="w-20 h-20 rounded-full object-cover" />
              : <div className="w-20 h-20 rounded-full bg-peach-100 flex items-center justify-center"><UserCircle className="w-10 h-10 text-peach-400" /></div>
            }
            <div>
              <h2 className="text-xl font-bold text-sage-800">{caretaker.displayName}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-medium text-sage-700">{caretaker.rating}</span>
                <span className="text-sage-400 text-sm">· {caretaker.completedJobs} jobs</span>
              </div>
              <div className="text-sm text-sage-500 mt-1">{caretaker.experienceYears} years experience · {caretaker.availability}</div>
            </div>
          </div>
          <p className="text-sage-600 text-sm leading-relaxed mb-4">{caretaker.bio}</p>
          <div>
            <div className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-2">Skills</div>
            <div className="flex flex-wrap gap-2">
              {caretaker.skills.map(s => <span key={s} className="badge-green">{s}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

