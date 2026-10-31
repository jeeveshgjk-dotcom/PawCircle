import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PawPrint, Briefcase, CheckCircle, Clock, Plus, ArrowRight,
  AlertCircle, Cloud, RefreshCw, Calendar, Heart
} from 'lucide-react';
import { getPets, type PetWithPhoto } from '../services/petService';
import {
  getLiveHouseholdJobs,
  getLiveCareTasks,
  type LiveCareOpportunity,
  type LiveCareTask
} from '../services/liveDataService';
import { MigrationBanner } from '../components/MigrationBanner';
import { OnboardingModal } from '../components/OnboardingModal';

export default function OwnerDashboard() {
  const { user, profile, household, migrationNeeded, refreshProfile, refreshHousehold } = useAuth();

  const [pets, setPets] = useState<PetWithPhoto[]>([]);
  const [jobs, setJobs] = useState<LiveCareOpportunity[]>([]);
  const [tasks, setTasks] = useState<LiveCareTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if onboarding is needed (missing display name)
  useEffect(() => {
    if (user && profile && (!profile.display_name || profile.display_name === 'User')) {
      setShowOnboarding(true);
    }
  }, [user, profile]);

  const loadData = useCallback(async () => {
    if (!household?.id || !user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [petData, jobData, taskData] = await Promise.all([
        getPets(household.id),
        getLiveHouseholdJobs(household.id),
        getLiveCareTasks(household.id),
      ]);
      setPets(petData);
      setJobs(jobData);
      setTasks(taskData);
    } catch (err: any) {
      console.error('Error loading cloud records:', err);
      setError(err.message || 'Failed to load household data.');
    } finally {
      setLoading(false);
    }
  }, [household?.id, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Friend';
  const householdName = household?.name || `${displayName}'s Household`;

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div>
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          refreshProfile();
          refreshHousehold();
        }}
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="section-title">👋 Welcome, {displayName}!</h1>
            <p className="section-sub">
              Household: <strong>{householdName}</strong> • Private cloud dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
              <Cloud className="w-3.5 h-3.5 text-green-600" /> Supabase Live
            </span>
            <button
              onClick={loadData}
              className="p-2 rounded-xl text-sage-400 hover:text-sage-700 hover:bg-sage-100 transition-colors"
              title="Refresh cloud data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {migrationNeeded && <MigrationBanner />}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <div className="font-semibold">Unable to load cloud records</div>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-xs font-semibold underline text-red-700 hover:text-red-900"
            >
              Retry request
            </button>
          </div>
        </div>
      )}

      {/* Real Statistics for Active User */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0">
            <PawPrint className="w-5 h-5 text-sage-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sage-800">
              {loading ? '—' : pets.length}
            </div>
            <div className="text-xs text-sage-500 font-medium">My Pets</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-peach-100 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-peach-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sage-800">
              {loading ? '—' : jobs.length}
            </div>
            <div className="text-xs text-sage-500 font-medium">Care Jobs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sage-800">
              {loading ? '—' : pendingTasks.length}
            </div>
            <div className="text-xs text-sage-500 font-medium">Pending Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sage-800">
              {loading ? '—' : completedTasks.length}
            </div>
            <div className="text-xs text-sage-500 font-medium">Completed Care</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pets List */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sage-800 flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-sage-600" /> Household Pets
                <span className="text-xs badge-green">{pets.length}</span>
              </h2>
              <Link to="/pets/new" className="text-sm font-semibold text-sage-600 hover:text-sage-800 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Pet
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-sage-500">
                Loading your pets from Supabase...
              </div>
            ) : pets.length > 0 ? (
              <div className="space-y-3">
                {pets.map(pet => (
                  <Link
                    to={`/pets/${pet.id}/edit`}
                    key={pet.id}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sage-50 transition-colors border border-sage-50 hover:border-sage-200"
                  >
                    {pet.displayPhotoUrl ? (
                      <img
                        src={pet.displayPhotoUrl}
                        alt={pet.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center text-xl flex-shrink-0">
                        🐾
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sage-800">{pet.name}</div>
                      <div className="text-xs text-sage-500">
                        {pet.breed || pet.species} • {pet.species}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-sage-300" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 px-4 bg-sage-50/40 rounded-2xl border border-dashed border-sage-200">
                <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center mx-auto mb-3 text-2xl">
                  🐾
                </div>
                <h3 className="font-semibold text-sage-800 text-sm mb-1">
                  You haven't added any pets yet
                </h3>
                <p className="text-xs text-sage-500 max-w-sm mx-auto mb-4">
                  Add your dog, cat, or other pet to store health records, routines, and care information.
                </p>
                <Link to="/pets/new" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4">
                  <Plus className="w-3.5 h-3.5" /> Add Your First Pet
                </Link>
              </div>
            )}
          </div>

          {/* Household Care Jobs */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sage-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sage-600" /> Care Jobs
                <span className="text-xs badge-peach">{jobs.length}</span>
              </h2>
              <Link to="/jobs/new" className="text-sm font-semibold text-sage-600 hover:text-sage-800 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Post Job
              </Link>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-sage-500">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 bg-sage-50/40 rounded-xl border border-dashed border-sage-200">
                <p className="text-xs text-sage-500 mb-3">No care jobs posted yet for this household.</p>
                <Link to="/jobs/new" className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Post Your First Care Job
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {jobs.slice(0, 3).map(j => (
                  <Link
                    key={j.id}
                    to="/jobs"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-sage-50 transition-colors border border-sage-100 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-sage-800">{j.title}</div>
                      <div className="text-sage-400 text-[11px] mt-0.5">
                        {j.location} • ₹{j.offered_amount_inr}
                      </div>
                    </div>
                    <span className="badge-green capitalize text-[11px]">{j.status}</span>
                  </Link>
                ))}
                {jobs.length > 3 && (
                  <Link to="/jobs" className="text-xs text-sage-600 font-semibold block text-center pt-2">
                    View all {jobs.length} care jobs →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-sage-800 text-sm mb-3">Quick Navigation</h3>
            <div className="space-y-2">
              <Link
                to="/pets/new"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-sage-50 text-xs font-medium text-sage-700 transition-colors"
              >
                <Plus className="w-4 h-4 text-sage-500" />
                Add a Pet to Household
              </Link>
              <Link
                to="/jobs/new"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-sage-50 text-xs font-medium text-sage-700 transition-colors"
              >
                <Briefcase className="w-4 h-4 text-sage-500" />
                Post a Care Job
              </Link>
              <Link
                to="/schedule"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-sage-50 text-xs font-medium text-sage-700 transition-colors"
              >
                <Calendar className="w-4 h-4 text-sage-500" />
                Daily Care Schedule
              </Link>
              <Link
                to="/health"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-sage-50 text-xs font-medium text-sage-700 transition-colors"
              >
                <Heart className="w-4 h-4 text-sage-500" />
                Pet Health Records
              </Link>
              <button
                onClick={() => setShowOnboarding(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-sage-50 text-xs font-medium text-sage-700 transition-colors text-left"
              >
                <PawPrint className="w-4 h-4 text-sage-500" />
                Edit Profile & Household Name
              </button>
            </div>
          </div>

          {/* Cloud Security Info */}
          <div className="card bg-sage-50/50 border-sage-100">
            <h3 className="font-semibold text-sage-800 text-xs mb-2 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-green-600" />
              Row Level Security Active
            </h3>
            <p className="text-[11px] text-sage-500 leading-relaxed">
              Your pets, care jobs, routines, and records are private. Only authenticated members of your household can view or manage them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
