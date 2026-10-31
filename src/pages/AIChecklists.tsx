import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useApp } from '../context/AppContext';
import { Plus, Clipboard, CheckCircle, Circle, Sparkles, Trash2, Check, X } from 'lucide-react';
import type { ChecklistItem } from '../types';

const SAMPLE_SUGGESTIONS: Record<string, string[]> = {
  feeding: [
    'Provide fresh water twice daily',
    'Feed {petName} as per their regular portion size',
    'Check food bowl is clean before each meal',
    'Note any food left uneaten in completion notes',
    'Avoid giving human food or treats not approved by owner',
  ],
  walking: [
    'Use a secure leash and harness for all walks',
    'Carry waste bags and clean up after {petName}',
    'Avoid busy roads — use parks or quiet streets',
    'Watch for signs of tiredness; don\'t over-walk',
    'Check paws for cuts, thorns or debris after each walk',
  ],
  grooming: [
    'Brush coat gently for at least 10 minutes',
    'Check ears for redness, odour or discharge',
    'Wipe eyes gently with a damp cloth if needed',
    'Trim nails only if comfortable doing so, else skip',
    'Note any skin irritation or unusual lumps',
  ],
  general: [
    'Greet {petName} calmly to help them feel safe',
    'Keep all exits closed — do not let {petName} escape',
    'In an emergency, contact the owner immediately',
    'Do not give any medication unless instructed by owner',
    'Take a photo to send the owner as a daily update',
  ],
};

export default function AIChecklists() {
  const { householdId } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ petId: '', title: '', instructions: '', category: 'general' });
  const [preview, setPreview] = useState<ChecklistItem[] | null>(null);

  const pets = useLiveQuery(() => db.pets.where('householdId').equals(householdId).toArray(), [householdId]);
  const checklists = useLiveQuery(() => db.checklists.reverse().toArray(), []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const generatePreview = () => {
    const pet = pets?.find(p => p.id === form.petId);
    const base = SAMPLE_SUGGESTIONS[form.category] ?? SAMPLE_SUGGESTIONS.general;
    const items: ChecklistItem[] = base.map(text => ({
      id: crypto.randomUUID(),
      text: text.replace('{petName}', pet?.name ?? 'your pet'),
      done: false,
    }));
    if (form.instructions.trim()) {
      items.push({
        id: crypto.randomUUID(),
        text: `Custom instruction: ${form.instructions.trim()}`,
        done: false,
      });
    }
    setPreview(items);
  };

  const approveAndSave = async () => {
    if (!preview || !form.petId || !form.title) return;
    const now = new Date().toISOString();
    await db.checklists.add({
      id: crypto.randomUUID(),
      petId: form.petId,
      title: form.title,
      sourceInstructions: form.instructions,
      status: 'approved',
      items: preview,
      createdAt: now,
      updatedAt: now,
    });
    setPreview(null);
    setShowForm(false);
    setForm({ petId: '', title: '', instructions: '', category: 'general' });
  };

  const toggleItem = (checklistId: string, itemId: string) => {
    const cl = checklists?.find(c => c.id === checklistId);
    if (!cl) return;
    const updated = cl.items.map(item => item.id === itemId ? { ...item, done: !item.done } : item);
    db.checklists.update(checklistId, { items: updated, updatedAt: new Date().toISOString() });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">AI Checklists</h1>
          <p className="section-sub">Generate smart care checklists. Review and approve before saving.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Checklist
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
        <Sparkles className="w-4 h-4 inline mr-1.5" />
        <strong>Local mode:</strong> Suggestions are generated from built-in templates. Gemini AI integration will be added later. Owner must review and approve before saving.
      </div>

      {showForm && (
        <div className="card mb-6 space-y-4">
          <h3 className="font-semibold text-sage-800">Generate Checklist</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Pet *</label>
              <select className="input" value={form.petId} onChange={set('petId')} required>
                <option value="">Select pet…</option>
                {pets?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {Object.keys(SAMPLE_SUGGESTIONS).map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Checklist Title *</label>
            <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Weekend Care for Bruno" />
          </div>
          <div>
            <label className="label">Special Instructions (optional)</label>
            <textarea className="input" rows={2} value={form.instructions} onChange={set('instructions')} placeholder="Any specific notes or requirements for the caretaker…" />
          </div>
          <button onClick={generatePreview} disabled={!form.petId || !form.title} className="btn-primary w-full flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Generate Preview
          </button>

          {/* Preview */}
          {preview && (
            <div className="bg-sage-50 rounded-xl p-4 space-y-3">
              <div className="font-semibold text-sage-700 text-sm flex items-center gap-2"><Clipboard className="w-4 h-4" /> Preview — Review before saving</div>
              <div className="space-y-2">
                {preview.map((item, i) => (
                  <div key={item.id} className="flex items-start gap-3 p-2.5 bg-white rounded-lg text-sm">
                    <span className="w-5 h-5 rounded-full bg-sage-100 text-sage-500 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-sage-700">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={approveAndSave} className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm">
                  <Check className="w-4 h-4" /> Approve & Save
                </button>
                <button onClick={() => setPreview(null)} className="btn-outline text-sm flex items-center gap-1.5">
                  <X className="w-4 h-4" /> Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Checklists */}
      <div className="space-y-5">
        {checklists?.map(cl => {
          const pet = pets?.find(p => p.id === cl.petId);
          const done = cl.items.filter(i => i.done).length;
          const pct = cl.items.length > 0 ? Math.round((done / cl.items.length) * 100) : 0;
          return (
            <div key={cl.id} className="card">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-sage-800">{cl.title}</h3>
                  <div className="text-sm text-sage-500 mt-0.5">{pet?.name} · {new Date(cl.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-green">{cl.status === 'approved' ? '✅ Approved' : '📝 Draft'}</span>
                  <button onClick={async () => {
                    if (confirm('Delete this checklist?')) await db.checklists.delete(cl.id);
                  }} className="p-1.5 rounded-lg text-sage-200 hover:text-red-400 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-sage-500 mb-1">
                  <span>{done}/{cl.items.length} tasks done</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 bg-sage-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sage-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {cl.items.map(item => (
                  <label key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-sage-50 cursor-pointer transition-colors">
                    <button onClick={() => toggleItem(cl.id, item.id)} className="mt-0.5 flex-shrink-0">
                      {item.done
                        ? <CheckCircle className="w-5 h-5 text-green-500" />
                        : <Circle className="w-5 h-5 text-sage-300" />}
                    </button>
                    <span className={`text-sm leading-relaxed ${item.done ? 'line-through text-sage-300' : 'text-sage-700'}`}>{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {!checklists?.length && (
          <div className="text-center py-14 text-sage-400">
            <Clipboard className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-sage-600">No checklists yet</p>
            <p className="text-sm mt-1">Generate your first care checklist above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

