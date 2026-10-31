import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PawPrint, User, Home, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import type { UserRole } from '../types/database';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const { user, profile, household, updateProfile, updateHouseholdName } = useAuth();

  const [name, setName] = useState(profile?.display_name || user?.email?.split('@')[0] || '');
  const [role, setRole] = useState<UserRole>(profile?.role || 'owner');
  const [householdName, setHouseholdName] = useState(household?.name || `${name || 'My'}'s Family`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateProfile({
        display_name: name.trim(),
        role,
      });

      if (role === 'owner' && householdName.trim()) {
        await updateHouseholdName(householdName.trim());
      }

      onComplete();
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      setError(err.message || 'Failed to save setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-sage-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-br from-sage-50 to-peach-50 p-6 border-b border-sage-100 text-center">
          <div className="w-12 h-12 rounded-2xl bg-sage-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <PawPrint className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-sage-900">Welcome to PawCircle!</h2>
          <p className="text-xs text-sage-600 mt-1">
            Let's personalize your real cloud account in just a few seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="label">Your Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-sage-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!householdName || householdName.includes('Family')) {
                    setHouseholdName(`${e.target.value.trim()}'s Family`);
                  }
                }}
                placeholder="e.g. Alex Sharma"
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="label">What is your primary role?</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === 'owner'
                    ? 'border-sage-500 bg-sage-50 text-sage-800 ring-2 ring-sage-400/30'
                    : 'border-sage-200 hover:bg-sage-50/50 text-sage-600'
                }`}
              >
                <div className="text-sm font-semibold">🏠 Pet Owner</div>
                <div className="text-[11px] text-sage-500 mt-0.5">Manage pets & care</div>
              </button>
              <button
                type="button"
                onClick={() => setRole('caretaker')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === 'caretaker'
                    ? 'border-peach-400 bg-peach-50 text-peach-800 ring-2 ring-peach-300/30'
                    : 'border-sage-200 hover:bg-peach-50/30 text-sage-600'
                }`}
              >
                <div className="text-sm font-semibold">🐾 Caretaker</div>
                <div className="text-[11px] text-sage-500 mt-0.5">Offer pet care</div>
              </button>
            </div>
          </div>

          {role === 'owner' && (
            <div>
              <label className="label">Household / Family Name</label>
              <div className="relative">
                <Home className="w-4 h-4 text-sage-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="e.g. The Sharma Household"
                  className="input pl-10"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Setup...
                </>
              ) : (
                <>
                  Continue to My Dashboard <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

