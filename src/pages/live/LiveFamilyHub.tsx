import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getLiveFamilyMembers,
  createLiveFamilyMember,
  deleteLiveFamilyMember,
  getAvailablePetOwners,
  addCoOwnerToHousehold,
  removeCoOwnerFromHousehold,
  type LiveFamilyMember,
  type RegisteredUserSummary
} from '../../services/liveDataService';
import {
  Plus, Users, Trash2, ShieldCheck, UserPlus,
  CheckCircle, Mail, AlertCircle, Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LiveFamilyHub() {
  const { user, household, profile } = useAuth();
  const [members, setMembers] = useState<LiveFamilyMember[]>([]);
  const [availableOwners, setAvailableOwners] = useState<RegisteredUserSummary[]>([]);
  const [existingCoOwners, setExistingCoOwners] = useState<RegisteredUserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state for adding an available registered pet owner
  const [showAddOwnerModal, setShowAddOwnerModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [addingOwner, setAddingOwner] = useState(false);

  // Form state for adding a non-login family helper
  const [showHelperForm, setShowHelperForm] = useState(false);
  const [helperForm, setHelperForm] = useState({ name: '', role: 'Family Helper', responsibilities: '' });

  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id || !household?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [m, { available, existingCoOwners }] = await Promise.all([
        getLiveFamilyMembers(household.id),
        getAvailablePetOwners(user.id, household.id),
      ]);
      setMembers(m);
      setAvailableOwners(available);
      setExistingCoOwners(existingCoOwners);
    } catch (err) {
      console.error('Error loading family members:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, household?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddCoOwner = async (targetUser: RegisteredUserSummary) => {
    if (!household?.id) return;
    setAddingOwner(true);
    setError(null);
    try {
      await addCoOwnerToHousehold(household.id, targetUser, 'owner', [
        'Shared Pet Care',
        'Health & Routine Oversight',
        'Care Opportunities',
      ]);
      setNotification(`🎉 ${targetUser.display_name} has been added as a Pet Co-Owner! They now have full access to view and manage all pets in ${household.name}.`);
      setShowAddOwnerModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add pet owner.');
    } finally {
      setAddingOwner(false);
    }
  };

  const handleAddByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!household?.id) return;
    if (!customEmail.trim()) {
      setError('Please provide an email address.');
      return;
    }

    setAddingOwner(true);
    setError(null);
    try {
      const emailTrimmed = customEmail.trim().toLowerCase();
      // Check if user is in available list
      const matched = availableOwners.find(o => o.email?.toLowerCase() === emailTrimmed);
      const targetUser: RegisteredUserSummary = matched || {
        id: crypto.randomUUID(),
        email: emailTrimmed,
        display_name: customName.trim() || emailTrimmed.split('@')[0],
        role: 'owner',
      };

      await addCoOwnerToHousehold(household.id, targetUser, 'owner', [
        'Shared Pet Care',
        'Health & Routine Oversight',
        'Care Opportunities',
      ]);

      setNotification(`🎉 ${targetUser.display_name} has been added as a Pet Co-Owner! Pet details are now shared with them.`);
      setShowAddOwnerModal(false);
      setCustomEmail('');
      setCustomName('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add pet owner by email.');
    } finally {
      setAddingOwner(false);
    }
  };

  const handleRemoveCoOwner = async (coOwner: RegisteredUserSummary) => {
    if (!household?.id) return;
    if (window.confirm(`Are you sure you want to remove ${coOwner.display_name} from this household? They will no longer have access to this household's pets.`)) {
      await removeCoOwnerFromHousehold(household.id, coOwner.id, coOwner.display_name);
      setNotification(`${coOwner.display_name} has been removed from the household.`);
      loadData();
    }
  };

  const handleAddHelper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!household?.id) return;
    if (!helperForm.name.trim()) {
      setError('Please provide a name.');
      return;
    }

    try {
      const resps = helperForm.responsibilities
        .split(',')
        .map(r => r.trim())
        .filter(Boolean);

      await createLiveFamilyMember(household.id, {
        name: helperForm.name.trim(),
        role: helperForm.role,
        responsibilities: resps.length > 0 ? resps : ['Daily pet care assistance'],
      });
      setShowHelperForm(false);
      setHelperForm({ name: '', role: 'Family Helper', responsibilities: '' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add helper.');
    }
  };

  const handleDeleteHelper = async (memberId: string) => {
    if (window.confirm('Remove this family helper?')) {
      await deleteLiveFamilyMember(memberId);
      loadData();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="section-title">Family Care Hub</h1>
          <p className="section-sub">
            Household: <strong>{household?.name || 'My Household'}</strong> • Manage pet co-owners, family members, and shared pet care.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowAddOwnerModal(true);
              setError(null);
            }}
            className="btn-primary flex items-center gap-2 text-xs py-2 px-3.5"
          >
            <UserPlus className="w-4 h-4" /> Add Pet Co-Owner
          </button>
          <button
            onClick={() => setShowHelperForm(!showHelperForm)}
            className="btn-outline flex items-center gap-2 text-xs py-2 px-3"
          >
            <Plus className="w-4 h-4" /> Add Helper
          </button>
        </div>
      </div>

      {notification && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 text-xs p-3.5 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-green-700 hover:text-green-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Shared Household Banner */}
      <div className="bg-sage-50/70 border border-sage-100 rounded-xl p-4 mb-6 text-xs text-sage-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-sage-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Shared Pet Ownership:</strong> All registered pet owners added to this household become co-owners of your pets. They will see the pet profiles in their <strong>"My Pets"</strong> tab, can log vaccinations, manage schedules, and share care responsibilities seamlessly.
        </div>
      </div>

      {/* ─── Add Pet Owner Modal / Section ─── */}
      {showAddOwnerModal && (
        <div className="card mb-6 border-2 border-sage-300 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-sage-100 pb-3">
            <div>
              <h3 className="font-bold text-sage-800 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sage-600" /> Add Available Pet Owner to Household
              </h3>
              <p className="text-xs text-sage-500 mt-0.5">
                Co-owners have full access to view, edit, and care for this household's pets.
              </p>
            </div>
            <button
              onClick={() => setShowAddOwnerModal(false)}
              className="text-sage-400 hover:text-sage-600 p-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* List of Available Registered Pet Owners */}
          {availableOwners.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-sage-700 uppercase tracking-wide mb-2.5">
                Available Registered Pet Owners ({availableOwners.length})
              </h4>
              <div className="space-y-2">
                {availableOwners.map(owner => (
                  <div
                    key={owner.id}
                    className="p-3 bg-white border border-sage-100 rounded-xl flex items-center justify-between gap-3 hover:border-sage-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-peach-100 text-peach-700 flex items-center justify-center font-bold text-xs">
                        {owner.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sage-800 text-xs">{owner.display_name}</div>
                        <div className="text-[11px] text-sage-400">{owner.email || 'Registered User'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddCoOwner(owner)}
                      disabled={addingOwner}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add as Co-Owner
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add by email */}
          <form onSubmit={handleAddByEmail} className="pt-2 border-t border-sage-100 space-y-3">
            <h4 className="text-xs font-semibold text-sage-700 uppercase tracking-wide">
              Or Add Pet Owner by Email
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Owner's Email Address *</label>
                <input
                  type="email"
                  className="input text-xs"
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  placeholder="e.g. partner@example.com"
                  required
                />
              </div>
              <div>
                <label className="label">Display Name (optional)</label>
                <input
                  className="input text-xs"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. Priya"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowAddOwnerModal(false)}
                className="btn-outline text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingOwner}
                className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" /> Add to Household
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Add Family Helper Form (Non-login) ─── */}
      {showHelperForm && (
        <form onSubmit={handleAddHelper} className="card mb-6 space-y-4">
          <h3 className="font-semibold text-sage-800 text-sm">Add Family Member / Helper (Non-login)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                className="input"
                value={helperForm.name}
                onChange={e => setHelperForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Rohit"
                required
              />
            </div>
            <div>
              <label className="label">Role</label>
              <input
                className="input"
                value={helperForm.role}
                onChange={e => setHelperForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Morning Walker, Grandparent, Child"
              />
            </div>
          </div>
          <div>
            <label className="label">Responsibilities (comma separated)</label>
            <input
              className="input"
              value={helperForm.responsibilities}
              onChange={e => setHelperForm(f => ({ ...f, responsibilities: e.target.value }))}
              placeholder="e.g. Evening walk, Clean food bowls, Weekend brushing"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary text-xs py-2 px-4">
              Save Helper
            </button>
            <button
              type="button"
              onClick={() => setShowHelperForm(false)}
              className="btn-outline text-xs py-2 px-4"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ─── Registered Household Co-Owners Section ─── */}
      <div className="mb-6 space-y-3">
        <h2 className="font-semibold text-sage-800 text-sm flex items-center gap-2">
          <Heart className="w-4 h-4 text-peach-500" /> Registered Pet Co-Owners
          <span className="badge-green text-xs">{existingCoOwners.length + 1}</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          {/* Primary Owner (Current User or Creator) */}
          <div className="card border-l-4 border-l-sage-500 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="font-bold text-sage-800 text-sm flex items-center gap-1.5">
                  {profile?.display_name || 'Primary Owner'}
                  <span className="badge-green text-[10px] py-0.5 px-2">Primary Admin</span>
                </div>
                <div className="text-xs text-sage-500 mt-0.5">{user?.email}</div>
                <div className="text-[11px] text-sage-400 mt-1">Full access to all household pets</div>
              </div>
            </div>
          </div>

          {/* Additional Registered Co-Owners */}
          {existingCoOwners.map(coOwner => (
            <div
              key={coOwner.id}
              className="card border-l-4 border-l-peach-400 flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-peach-100 text-peach-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {coOwner.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sage-800 text-sm flex items-center gap-1.5">
                    {coOwner.display_name}
                    <span className="badge-peach text-[10px] py-0.5 px-2">🐾 Co-Owner</span>
                  </div>
                  <div className="text-xs text-sage-500 mt-0.5">{coOwner.email}</div>
                  <div className="text-[11px] text-green-700 font-medium mt-1">
                    ✓ Shares access to pets, health & routines
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRemoveCoOwner(coOwner)}
                className="text-sage-300 hover:text-red-600 p-1 rounded-lg transition-colors"
                title="Remove co-owner"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Household Helpers & Family Members (Non-login) ─── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sage-800 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-sage-600" /> Household Helpers & Family Members
            <span className="badge-green text-xs">{members.length}</span>
          </h2>
          <button
            onClick={() => setShowHelperForm(true)}
            className="text-xs font-semibold text-sage-600 hover:text-sage-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Helper
          </button>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-sage-500">Loading family members...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-sage-400 bg-sage-50/40 rounded-xl border border-dashed border-sage-200">
            <p className="text-xs text-sage-500 mb-2">No household helpers added yet.</p>
            <p className="text-[11px] text-sage-400 max-w-sm mx-auto mb-3">
              Add children, roommates, or helpers to assign care responsibilities.
            </p>
            <button
              onClick={() => setShowHelperForm(true)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Add First Helper
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map(member => (
              <div
                key={member.id}
                className="p-3 bg-white border border-sage-100 rounded-xl flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sage-800 text-xs">{member.name}</h4>
                    <div className="text-[11px] text-sage-500">{member.role}</div>
                    {member.responsibilities && member.responsibilities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {member.responsibilities.map((resp, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-sage-50 text-sage-700 px-2 py-0.5 rounded-md border border-sage-100"
                          >
                            ✓ {resp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteHelper(member.id)}
                  className="text-sage-300 hover:text-red-600 p-1 rounded-lg transition-colors"
                  title="Remove helper"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
