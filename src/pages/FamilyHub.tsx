import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useApp } from '../context/AppContext';
import { Plus, Users, CheckCircle, Trash2 } from 'lucide-react';

export default function FamilyHub() {
  const { householdId } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', responsibilities: '' });

  const members = useLiveQuery(() => db.familyMembers.where('householdId').equals(householdId).toArray(), [householdId]);
  const tasks = useLiveQuery(() => db.careTasks.toArray(), []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    await db.familyMembers.add({
      id: crypto.randomUUID(),
      householdId,
      name: form.name,
      role: form.role,
      responsibilities: form.responsibilities.split(',').map(r => r.trim()).filter(Boolean),
      createdAt: now,
      updatedAt: now,
    });
    setShowForm(false);
    setForm({ name: '', role: '', responsibilities: '' });
  };

  const completedByMember = (memberId: string) =>
    tasks?.filter(t => t.completedBy === memberId && t.status === 'completed').length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Family Hub</h1>
          <p className="section-sub">Manage family responsibilities and track care contributions.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      <div className="bg-sage-50 border border-sage-100 rounded-xl p-4 mb-6 text-sm text-sage-600">
        👨‍👩‍👧 Family profiles in this demo are local profiles — not authenticated accounts. They help organise who's responsible for what.
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
          <h3 className="font-semibold text-sage-800">Add Family Member</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Sam" required />
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input" value={form.role} onChange={set('role')} placeholder="e.g. Family Helper" />
            </div>
          </div>
          <div>
            <label className="label">Responsibilities (comma-separated)</label>
            <input className="input" value={form.responsibilities} onChange={set('responsibilities')} placeholder="e.g. Walks, Play sessions, Grooming" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary flex-1">Add Member</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {members?.map(member => {
          const completed = completedByMember(member.id);
          const avatarColors = ['bg-sage-400', 'bg-peach-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400'];
          const color = avatarColors[members.indexOf(member) % avatarColors.length];
          return (
            <div key={member.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                    {member.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-sage-800">{member.name}</div>
                    <div className="text-sm text-sage-500">{member.role}</div>
                  </div>
                </div>
                <button onClick={async () => {
                  if (confirm(`Remove ${member.name}?`)) await db.familyMembers.delete(member.id);
                }} className="p-1.5 rounded-lg text-sage-200 hover:text-red-400 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contributions */}
              <div className="flex items-center gap-2 mb-4 p-2.5 bg-sage-50 rounded-xl">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div className="text-sm font-semibold text-sage-700">{completed} task{completed !== 1 ? 's' : ''} completed</div>
              </div>

              {member.responsibilities && member.responsibilities.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-2">Responsibilities</div>
                  <div className="flex flex-wrap gap-1.5">
                    {member.responsibilities.map((r, i) => (
                      <span key={i} className="badge-green">{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!members?.length && (
        <div className="text-center py-14 text-sage-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-sage-600">No family members yet</p>
          <p className="text-sm mt-1">Add family members to assign care responsibilities.</p>
        </div>
      )}
    </div>
  );
}

