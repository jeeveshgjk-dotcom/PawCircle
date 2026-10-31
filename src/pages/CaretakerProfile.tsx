import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, UserCircle, Edit2, Loader2, AlertCircle, Cloud } from 'lucide-react';

export default function CaretakerProfile() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    experienceYears: '',
    skills: '',
    availability: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.display_name || user?.email?.split('@')[0] || '',
        bio: profile.bio || '',
        experienceYears: String(profile.experience_years ?? 0),
        skills: profile.skills?.join(', ') || '',
        availability: profile.availability || '',
      });
    }
  }, [profile, user]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile({
        display_name: form.displayName.trim(),
        bio: form.bio.trim(),
        experience_years: form.experienceYears ? Number(form.experienceYears) : 0,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        availability: form.availability.trim(),
      });
      await refreshProfile();
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating caretaker profile:', err);
      setError(err.message || 'Failed to save profile changes to Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Caretaker';

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="section-title">My Profile</h1>
          <p className="section-sub">Your caretaker credentials saved in Supabase.</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="btn-outline flex items-center gap-2 text-xs py-2 px-3"
        >
          <Edit2 className="w-3.5 h-3.5" /> {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded-xl">
          ✅ Profile updated successfully in Supabase!
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSave} className="card space-y-4">
          <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold mb-2">
            <Cloud className="w-3.5 h-3.5" /> Changes will save to your Supabase cloud profile
          </div>

          <div>
            <label className="label">Display Name *</label>
            <input
              className="input"
              value={form.displayName}
              onChange={set('displayName')}
              required
            />
          </div>
          <div>
            <label className="label">Bio / About Me</label>
            <textarea
              className="input"
              rows={3}
              value={form.bio}
              onChange={set('bio')}
              placeholder="Tell pet owners about your experience, pet love, and reliability..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Years of Pet Care Experience</label>
              <input
                className="input"
                type="number"
                min="0"
                value={form.experienceYears}
                onChange={set('experienceYears')}
              />
            </div>
            <div>
              <label className="label">Availability</label>
              <input
                className="input"
                value={form.availability}
                onChange={set('availability')}
                placeholder="e.g. Weekends, Evenings"
              />
            </div>
          </div>
          <div>
            <label className="label">Skills (comma-separated)</label>
            <input
              className="input"
              value={form.skills}
              onChange={set('skills')}
              placeholder="e.g. Dog Walking, Medication, Puppy Care"
            />
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save to Supabase
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="card space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-peach-100 flex items-center justify-center text-peach-600 font-bold text-2xl flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-sage-800">{displayName}</h2>
              <div className="text-xs text-sage-500 mt-0.5">{user?.email}</div>
              <div className="text-xs text-sage-600 mt-1">
                {profile?.experience_years ? `${profile.experience_years} years experience` : 'New Caretaker'}
                {profile?.availability ? ` • ${profile.availability}` : ''}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-1">About</div>
            <p className="text-sm text-sage-700 leading-relaxed">
              {profile?.bio || 'No bio provided yet. Click "Edit Profile" to add information about your pet care experience.'}
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-2">Skills</div>
            <div className="flex flex-wrap gap-1.5">
              {profile?.skills && profile.skills.length > 0 ? (
                profile.skills.map((s) => <span key={s} className="badge-green">{s}</span>)
              ) : (
                <span className="text-xs text-sage-400">No skills added yet</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
