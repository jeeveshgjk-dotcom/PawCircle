import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPets, type PetWithPhoto } from '../../services/petService';
import {
  getLiveChecklists,
  saveLiveChecklist,
  toggleLiveChecklistItem,
  deleteLiveChecklist,
  type LiveChecklist,
  type LiveChecklistItem
} from '../../services/liveDataService';
import { Plus, Clipboard, CheckCircle, Circle, Sparkles, Trash2, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const SAMPLE_SUGGESTIONS: Record<string, string[]> = {
  feeding: [
    'Provide fresh drinking water twice daily',
    'Feed {petName} according to recommended meal portion',
    'Clean feeding and water bowls before serving',
    'Report any uneaten food or changes in appetite',
    'Avoid human food scraps or unapproved treats',
  ],
  walking: [
    'Use secure leash and collar/harness for all outdoor walks',
    'Carry waste bags and clean up after {petName}',
    'Avoid hot pavement during peak sunny hours',
    'Keep {petName} hydrated on warm walk days',
    'Check paws for debris or cuts after each walk',
  ],
  grooming: [
    'Brush coat gently for at least 10 minutes',
    'Inspect ears for redness, odor, or discharge',
    'Wipe eyes with a damp soft cloth if discharge present',
    'Check skin for irritation, ticks, or fleas',
    'Reward {petName} with a treat for calm grooming',
  ],
  general: [
    'Greet {petName} calmly to build trust and reassurance',
    'Ensure all front doors and balcony gates remain securely closed',
    'Administer prescribed supplements as instructed',
    'Send daily photo update and behavior notes to owner',
    'In case of emergency, contact the vet immediately',
  ],
};

export default function LiveAIChecklists() {
  const { user, household } = useAuth();
  const [pets, setPets] = useState<PetWithPhoto[]>([]);
  const [checklists, setChecklists] = useState<LiveChecklist[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pet_id: '',
    title: '',
    instructions: '',
    category: 'general',
  });
  const [previewItems, setPreviewItems] = useState<LiveChecklistItem[] | null>(null);
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
      const lists = await getLiveChecklists(petIds);
      setChecklists(lists);
      if (p.length > 0 && !form.pet_id) {
        setForm(prev => ({ ...prev, pet_id: p[0].id }));
      }
    } catch (err) {
      console.error('Error loading checklists:', err);
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

  const handleGeneratePreview = () => {
    const pet = pets.find(p => p.id === form.pet_id);
    const petName = pet?.name || 'your pet';
    const base = SAMPLE_SUGGESTIONS[form.category] || SAMPLE_SUGGESTIONS.general;

    const items: LiveChecklistItem[] = base.map(text => ({
      id: crypto.randomUUID(),
      text: text.replace('{petName}', petName),
      done: false,
    }));

    if (form.instructions.trim()) {
      items.push({
        id: crypto.randomUUID(),
        text: `Special: ${form.instructions.trim()}`,
        done: false,
      });
    }

    setPreviewItems(items);
  };

  const handleSaveChecklist = async () => {
    if (!user?.id || !form.pet_id || !previewItems || previewItems.length === 0) {
      setError('Please generate checklist items first.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const pet = pets.find(p => p.id === form.pet_id);
      const title =
        form.title.trim() ||
        `${pet?.name || 'Pet'} ${form.category.charAt(0).toUpperCase() + form.category.slice(1)} Care Checklist`;

      await saveLiveChecklist({
        pet_id: form.pet_id,
        title,
        source_instructions: form.instructions,
        items: previewItems,
        status: 'approved',
      });

      setShowForm(false);
      setPreviewItems(null);
      setForm(prev => ({ ...prev, title: '', instructions: '' }));
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save checklist.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleItem = async (checklistId: string, itemId: string) => {
    await toggleLiveChecklistItem(checklistId, itemId);
    loadData();
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    if (window.confirm('Delete this care checklist?')) {
      await deleteLiveChecklist(checklistId);
      loadData();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">AI Care Checklists</h1>
          <p className="section-sub">
            Generate and customize smart care checklists for caretakers and household members.
          </p>
        </div>
        {pets.length > 0 && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setPreviewItems(null);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-peach-200" />
            <Plus className="w-4 h-4" /> Create Checklist
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
            Add your pet first before generating tailored care checklists.
          </p>
          <Link to="/pets/new" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4">
            <Plus className="w-4 h-4" /> Add a Pet
          </Link>
        </div>
      )}

      {showForm && (
        <div className="card mb-6 space-y-4">
          <h3 className="font-semibold text-sage-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-peach-500" /> Generate AI Care Checklist
          </h3>
          {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <label className="label">Checklist Type *</label>
              <select
                className="input"
                value={form.category}
                onChange={handleChange('category')}
              >
                <option value="general">📋 General Daily Care</option>
                <option value="feeding">🍖 Feeding & Hydration</option>
                <option value="walking">🦮 Outdoor Walking</option>
                <option value="grooming">✂️ Coat & Skin Grooming</option>
              </select>
            </div>
            <div>
              <label className="label">Custom Title (optional)</label>
              <input
                className="input"
                value={form.title}
                onChange={handleChange('title')}
                placeholder="e.g. Weekend Sitter Guidelines"
              />
            </div>
          </div>

          <div>
            <label className="label">Custom Instructions / Routine Details</label>
            <textarea
              className="input"
              rows={2}
              value={form.instructions}
              onChange={handleChange('instructions')}
              placeholder="e.g. Scared of thunder, give heartworm tablet on Saturday, loves belly rubs."
            />
          </div>

          <button
            type="button"
            onClick={handleGeneratePreview}
            className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-peach-600" /> Generate Suggested Tasks
          </button>

          {/* Generated Preview Items */}
          {previewItems && (
            <div className="pt-4 border-t border-sage-100 space-y-3">
              <h4 className="text-xs font-bold text-sage-700 uppercase tracking-wide">
                Review & Edit Items ({previewItems.length})
              </h4>
              <div className="space-y-1.5">
                {previewItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 bg-sage-50/70 p-2.5 rounded-xl text-xs text-sage-800"
                  >
                    <CheckCircle className="w-4 h-4 text-sage-400 flex-shrink-0" />
                    <input
                      className="flex-1 bg-transparent border-none outline-none text-xs"
                      value={item.text}
                      onChange={e => {
                        const updated = [...previewItems];
                        updated[idx].text = e.target.value;
                        setPreviewItems(updated);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewItems(previewItems.filter((_, i) => i !== idx));
                      }}
                      className="text-sage-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSaveChecklist}
                  className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Saving...' : 'Save Checklist to Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-outline text-xs py-2 px-4"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checklists List */}
      {loading ? (
        <div className="py-12 text-center text-sage-500">Loading checklists...</div>
      ) : checklists.length === 0 ? (
        <div className="text-center py-16 text-sage-400 card border-dashed">
          <Clipboard className="w-10 h-10 mx-auto mb-3 opacity-40 text-sage-500" />
          <p className="font-semibold text-sage-700 mb-1">No checklists created yet</p>
          <p className="text-xs text-sage-500 mb-5 max-w-sm mx-auto">
            Generate customized care checklists for dog sitters, cat boarding, walking, or family members.
          </p>
          {pets.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4"
            >
              <Sparkles className="w-3.5 h-3.5 text-peach-200" />
              <Plus className="w-4 h-4" /> Create First Checklist
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {checklists.map(c => {
            const pet = pets.find(p => p.id === c.pet_id);
            const completedCount = c.items.filter(i => i.done).length;
            const progress =
              c.items.length > 0 ? Math.round((completedCount / c.items.length) * 100) : 0;

            return (
              <div key={c.id} className="card hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-sage-800 text-sm">{c.title}</h3>
                    <div className="text-xs text-sage-500">
                      {pet?.name} • {completedCount} of {c.items.length} completed ({progress}%)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge-green text-xs">Active</span>
                    <button
                      onClick={() => handleDeleteChecklist(c.id)}
                      className="text-sage-300 hover:text-red-600 p-1 rounded-lg transition-colors"
                      title="Delete checklist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-sage-100 rounded-full h-1.5 mb-4">
                  <div
                    className="bg-sage-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {c.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(c.id, item.id)}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-sage-50 cursor-pointer transition-colors text-xs"
                    >
                      {item.done ? (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-sage-400 flex-shrink-0" />
                      )}
                      <span
                        className={
                          item.done ? 'line-through text-sage-400' : 'text-sage-800 font-medium'
                        }
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

