import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../db/database';
import { useDemo } from '../../context/DemoContext';
import {
  PawPrint, Briefcase, CheckCircle, Clock, Plus, ArrowRight,
  AlertCircle, TrendingUp, Users, Calendar, Sparkles
} from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'badge-green', filled: 'badge-peach', closed: 'badge bg-gray-100 text-gray-600',
    pending: 'badge-yellow', approved: 'badge-green', submitted: 'badge-blue',
    selected: 'badge-green', rejected: 'badge-red', in_progress: 'badge-peach',
    submitted_for_review: 'badge-blue', accepted: 'badge-green',
  };
  const labels: Record<string, string> = {
    open: 'Open', filled: 'Filled', closed: 'Closed',
    pending: 'Pending', approved: 'Approved', submitted: 'Applied',
    selected: 'Selected', rejected: 'Rejected', in_progress: 'In Progress',
    submitted_for_review: 'Under Review', accepted: 'Accepted',
  };
  return <span className={map[status] ?? 'badge bg-gray-100 text-gray-500'}>{labels[status] ?? status}</span>;
}

export default function DemoOwnerDashboard() {
  const { householdId } = useDemo();

  const pets = useLiveQuery(() => db.pets.where('householdId').equals(householdId).toArray(), [householdId]);
  const jobs = useLiveQuery(() => db.careOpportunities.where('ownerHouseholdId').equals(householdId).toArray(), [householdId]);
  const allApplications = useLiveQuery(() => db.applications.toArray(), []);
  const pendingTasks = useLiveQuery(() => db.careTasks.where('status').equals('pending').toArray(), []);
  const completedTasks = useLiveQuery(() => db.careTasks.where('status').equals('completed').toArray(), []);
  const earnings = useLiveQuery(() => db.earningsEntries.where('status').equals('pending').toArray(), []);

  const openJobs = jobs?.filter(j => j.status === 'open') ?? [];
  const recentApplications = allApplications
    ?.filter(a => jobs?.some(j => j.id === a.opportunityId))
    ?.slice(-4)
    ?.reverse() ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="section-title">👋 Demo Dashboard (Alex's Family)</h1>
            <p className="section-sub">
              Exploring sample routines, jobs, and tasks for <strong>Bruno</strong> and <strong>Luna</strong>.
            </p>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-peach-100 text-peach-700 text-xs font-semibold hover:bg-peach-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Ready for your real pets? Create an account →
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0">
            <PawPrint className="w-5 h-5 text-sage-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sage-800">{pets?.length ?? 0}</div>
            <div className="text-xs text-sage-500 font-medium">Sample Pets</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-peach-100 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-peach-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sage-800">{openJobs.length}</div>
            <div className="text-xs text-sage-500 font-medium">Open Jobs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sage-800">{pendingTasks?.length ?? 0}</div>
            <div className="text-xs text-sage-500 font-medium">Pending Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sage-800">{completedTasks?.length ?? 0}</div>
            <div className="text-xs text-sage-500 font-medium">Completed</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pets */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sage-800 flex items-center gap-2">
                <PawPrint className="w-4 h-4" /> Sample Pets
              </h2>
              <Link to="/demo/pets" className="text-sm text-sage-500 hover:text-sage-700 flex items-center gap-1">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {pets?.map(pet => (
                <div key={pet.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-sage-50 transition-colors">
                  {pet.photoUrl
                    ? <img src={pet.photoUrl} alt={pet.name} className="w-12 h-12 rounded-xl object-cover" />
                    : <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center text-xl">🐾</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sage-800">{pet.name}</div>
                    <div className="text-sm text-sage-500">{pet.breed} · {pet.species}</div>
                  </div>
                  <span className="badge-peach text-xs">Sample</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Jobs */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sage-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Care Jobs (Demo)
              </h2>
              <Link to="/demo/jobs" className="text-sm text-sage-500 hover:text-sage-700 flex items-center gap-1">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {jobs?.map(job => {
                const pet = pets?.find(p => p.id === job.petId);
                const appCount = allApplications?.filter(a => a.opportunityId === job.id).length ?? 0;
                return (
                  <Link to="/demo/jobs" key={job.id} className="block p-3 rounded-xl hover:bg-sage-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sage-800 text-sm">{job.title}</div>
                        <div className="text-xs text-sage-400 mt-0.5">{pet?.name} · ₹{job.offeredAmountINR}</div>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                    {appCount > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-sage-500">
                        <Users className="w-3 h-3" /> {appCount} application{appCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="card">
            <h2 className="font-semibold text-sage-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Pending Care Tasks (Demo)
            </h2>
            <div className="space-y-2">
              {pendingTasks?.slice(0, 5).map(task => {
                const pet = pets?.find(p => p.id === task.petId);
                return (
                  <Link to="/demo/schedule" key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-sage-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-sage-800">{task.title}</div>
                      <div className="text-xs text-sage-400">{pet?.name}</div>
                    </div>
                    <span className="badge-yellow">Pending</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Earnings Pending */}
          {earnings && earnings.length > 0 && (
            <div className="card border-l-4 border-l-yellow-400">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-yellow-600" />
                <h3 className="font-semibold text-sage-800 text-sm">Approval Needed (Demo)</h3>
              </div>
              {earnings.map(e => (
                <div key={e.id} className="text-sm">
                  <div className="text-2xl font-bold text-sage-700">₹{e.amountINR}</div>
                  <div className="text-sage-400 text-xs">Simulated earnings for Riya</div>
                  <Link to="/demo/jobs" className="btn-primary text-xs py-1.5 px-3 mt-3 inline-block">
                    Review in Demo
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Recent Applications */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sage-800 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Recent Applications
              </h3>
              <Link to="/demo/jobs" className="text-xs text-sage-400 hover:text-sage-600">View all</Link>
            </div>
            <div className="space-y-3">
              {recentApplications.map(app => (
                <div key={app.id} className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop" alt="Riya" className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-sage-800">Riya Sharma</div>
                    <div className="text-xs text-sage-400 truncate">{app.message.slice(0, 40)}…</div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-sage-800 text-sm mb-3">Demo Navigation</h3>
            <div className="space-y-2">
              <Link to="/demo/pets" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sage-50 text-xs text-sage-700">
                🐾 View Bruno & Luna Profiles
              </Link>
              <Link to="/demo/jobs" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sage-50 text-xs text-sage-700">
                📋 Review Care Jobs & Hiring
              </Link>
              <Link to="/demo/schedule" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sage-50 text-xs text-sage-700">
                📅 View Schedule & Routines
              </Link>
              <Link to="/demo/caretaker" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-peach-50 text-xs text-peach-700 font-medium">
                🐾 Switch to Caretaker View (Riya)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

