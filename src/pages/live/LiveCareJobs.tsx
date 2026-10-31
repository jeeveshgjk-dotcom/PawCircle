import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPets, type PetWithPhoto } from '../../services/petService';
import {
  getLiveHouseholdJobs,
  createLiveJob,
  getLiveJobApplications,
  getLiveJobAssignments,
  selectLiveApplicant,
  approveLiveWork,
  markLiveEarningsPaid,
  getLiveCareTasks,
  getLiveEarnings,
  type LiveCareOpportunity,
  type LiveApplication,
  type LiveAssignment,
  type LiveCareTask,
  type LiveEarningsEntry
} from '../../services/liveDataService';
import {
  Plus, MapPin, Calendar, IndianRupee, Users, ChevronDown,
  ChevronUp, CheckCircle, Clock, Briefcase, ArrowLeft, AlertCircle
} from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    open: { cls: 'badge-green', label: 'Open' },
    filled: { cls: 'badge-peach', label: 'Filled' },
    closed: { cls: 'badge bg-gray-100 text-gray-500', label: 'Closed' },
    submitted: { cls: 'badge-blue', label: 'Applied' },
    selected: { cls: 'badge-green', label: 'Selected ✓' },
    rejected: { cls: 'badge-red', label: 'Rejected' },
    offered: { cls: 'badge-peach', label: 'Offered' },
    accepted: { cls: 'badge-blue', label: 'Accepted' },
    in_progress: { cls: 'badge-peach', label: 'In Progress' },
    submitted_for_review: { cls: 'badge-blue', label: 'Under Review' },
    approved: { cls: 'badge-green', label: 'Approved ✓' },
    pending: { cls: 'badge-yellow', label: 'Pending Approval' },
    marked_paid: { cls: 'badge-green', label: 'Paid ✓' },
  };
  const c = cfg[status] ?? { cls: 'badge bg-gray-100 text-gray-500', label: status };
  return <span className={c.cls}>{c.label}</span>;
}

function LiveJobCard({
  job,
  pets,
  householdId,
  onRefresh,
}: {
  job: LiveCareOpportunity;
  pets: PetWithPhoto[];
  householdId: string;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [applications, setApplications] = useState<LiveApplication[]>([]);
  const [assignments, setAssignments] = useState<LiveAssignment[]>([]);
  const [tasks, setTasks] = useState<LiveCareTask[]>([]);
  const [earnings, setEarnings] = useState<LiveEarningsEntry[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const pet = pets.find(p => p.id === job.pet_id);
  const assignment = assignments[0];
  const earning = earnings.find(e => e.assignment_id === assignment?.id);

  const loadDetails = useCallback(async () => {
    setLoadingDetails(true);
    try {
      const [apps, assigns, allTasks, allEarnings] = await Promise.all([
        getLiveJobApplications(job.id),
        getLiveJobAssignments(job.id),
        getLiveCareTasks(householdId),
        getLiveEarnings('', false),
      ]);
      setApplications(apps);
      setAssignments(assigns);
      if (assigns.length > 0) {
        setTasks(allTasks.filter(t => t.assignment_id === assigns[0].id));
      }
      setEarnings(allEarnings);
    } finally {
      setLoadingDetails(false);
    }
  }, [job.id, householdId]);

  useEffect(() => {
    if (expanded) {
      loadDetails();
    }
  }, [expanded, loadDetails]);

  const handleSelectApplicant = async (app: LiveApplication) => {
    try {
      await selectLiveApplicant(householdId, job, app);
      onRefresh();
      loadDetails();
      setExpanded(true);
    } catch (err) {
      console.error('Error selecting applicant:', err);
    }
  };

  const handleApproveWork = async () => {
    if (!assignment || !earning) return;
    await approveLiveWork(assignment.id, earning.id);
    onRefresh();
    loadDetails();
  };

  const handleMarkPaid = async () => {
    if (!earning) return;
    await markLiveEarningsPaid(earning.id);
    onRefresh();
    loadDetails();
  };

  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        {pet?.displayPhotoUrl || job.pet_photo_url ? (
          <img
            src={pet?.displayPhotoUrl || job.pet_photo_url}
            alt={pet?.name || job.pet_name || 'Pet'}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-sage-100 flex items-center justify-center text-2xl flex-shrink-0">
            🐾
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-sage-800">{job.title}</h3>
              <div className="text-sm text-sage-500">
                {pet?.name || job.pet_name || 'Pet'} {pet?.species || job.pet_species ? `· ${pet?.species || job.pet_species}` : ''}
              </div>
            </div>
            <StatusBadge status={job.status} />
          </div>

          <div className="flex flex-wrap gap-3 mt-3 text-xs text-sage-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(job.start_at).toLocaleDateString()} – {new Date(job.end_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1 font-semibold text-sage-700">
              <IndianRupee className="w-3.5 h-3.5" />
              ₹{job.offered_amount_inr}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {applications.length} applicant{applications.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 w-full flex items-center justify-center gap-1 text-xs text-sage-500 hover:text-sage-700 py-1"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-3 h-3" /> Hide details
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3" /> Show details & applicants
          </>
        )}
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-sage-100 space-y-4">
          <p className="text-sm text-sage-600">{job.description}</p>

          {/* Tasks */}
          <div>
            <div className="text-xs font-semibold text-sage-600 uppercase tracking-wide mb-2">
              Required Tasks
            </div>
            <ul className="space-y-1">
              {job.tasks.map((t, i) => (
                <li key={i} className="text-sm text-sage-600 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-sage-400 flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Hired Caretaker Assignment Status */}
          {assignment && (
            <div className="bg-sage-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-sage-700 uppercase tracking-wide">
                    Hired Caretaker
                  </div>
                  <div className="font-bold text-sage-800 text-sm mt-0.5">
                    {assignment.caretaker_name || 'Selected Caretaker'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={assignment.status} />
                  {earning && <StatusBadge status={earning.status} />}
                </div>
              </div>

              {/* Task progress */}
              {tasks.length > 0 && (
                <div>
                  <div className="text-xs text-sage-500 mb-1.5">
                    Progress: {completedTasks.length} of {tasks.length} tasks completed
                  </div>
                  <div className="space-y-1">
                    {tasks.map(t => (
                      <div key={t.id} className="flex items-center gap-2 text-xs">
                        <CheckCircle
                          className={`w-3.5 h-3.5 ${
                            t.status === 'completed' ? 'text-green-500' : 'text-sage-300'
                          }`}
                        />
                        <span className={t.status === 'completed' ? 'line-through text-sage-400' : 'text-sage-700'}>
                          {t.title}
                        </span>
                        {t.notes && <span className="text-sage-400 italic">"{t.notes}"</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval & Payment Buttons */}
              {assignment.status !== 'approved' && (
                <button
                  onClick={handleApproveWork}
                  className="btn-primary w-full text-xs py-2"
                >
                  ✅ Approve Completed Work & Release ₹{job.offered_amount_inr}
                </button>
              )}

              {assignment.status === 'approved' && earning?.status !== 'marked_paid' && (
                <button
                  onClick={handleMarkPaid}
                  className="btn-secondary w-full text-xs py-2"
                >
                  💰 Mark as Paid (₹{job.offered_amount_inr})
                </button>
              )}

              {earning?.status === 'marked_paid' && (
                <div className="text-center text-xs font-semibold text-green-700 bg-green-50 py-2 rounded-lg border border-green-200">
                  ✓ Payment Settled in Ledger
                </div>
              )}
            </div>
          )}

          {/* Applicants */}
          {!assignment && (
            <div>
              <div className="text-xs font-semibold text-sage-600 uppercase tracking-wide mb-2">
                Applicants ({applications.length})
              </div>
              {loadingDetails ? (
                <div className="text-xs text-sage-400 py-2">Loading applicants...</div>
              ) : applications.length === 0 ? (
                <p className="text-xs text-sage-400 italic py-2">
                  No applications received yet. Caretakers in your area can browse and apply to this job from the marketplace.
                </p>
              ) : (
                <div className="space-y-2">
                  {applications.map(app => (
                    <div
                      key={app.id}
                      className="p-3 bg-white border border-sage-100 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-sage-800">
                          {app.caretaker_name || 'Caretaker Applicant'}
                        </div>
                        <div className="text-xs text-sage-600 mt-0.5">
                          "{app.message}"
                        </div>
                        <div className="text-[10px] text-sage-400 mt-1">
                          Applied on {new Date(app.applied_at).toLocaleDateString()}
                        </div>
                      </div>
                      {app.status === 'submitted' && (
                        <button
                          onClick={() => handleSelectApplicant(app)}
                          className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                        >
                          Select Caretaker
                        </button>
                      )}
                      {app.status === 'selected' && (
                        <span className="badge-green text-xs">Selected ✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LivePostJobForm() {
  const { user, profile, household } = useAuth();
  const navigate = useNavigate();

  const [pets, setPets] = useState<PetWithPhoto[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    pet_id: '',
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location: '',
    offered_amount_inr: '',
    tasks: '',
  });

  useEffect(() => {
    if (!household?.id) {
      setLoadingPets(false);
      return;
    }
    getPets(household.id)
      .then(p => {
        setPets(p);
        if (p.length > 0) {
          setForm(prev => ({ ...prev, pet_id: p[0].id }));
        }
      })
      .finally(() => setLoadingPets(false));
  }, [household?.id]);

  const handleChange = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !household?.id) return;
    if (!form.pet_id) {
      setError('Please select a pet for this care job.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const taskList = form.tasks
        .split('\n')
        .map(t => t.trim())
        .filter(Boolean);

      const selectedPet = pets.find(p => p.id === form.pet_id);

      await createLiveJob(user.id, household.id, {
        pet_id: form.pet_id,
        title: form.title,
        description: form.description,
        start_at: form.start_at,
        end_at: form.end_at,
        location: form.location,
        offered_amount_inr: parseFloat(form.offered_amount_inr) || 0,
        tasks: taskList.length > 0 ? taskList : ['Daily pet care'],
        pet_name: selectedPet?.name,
        pet_species: selectedPet?.species,
        pet_breed: selectedPet?.breed || undefined,
        pet_photo_url: selectedPet?.displayPhotoUrl || undefined,
        owner_name: profile?.display_name || user?.email?.split('@')[0],
      });

      navigate('/jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to post care job.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPets) {
    return <div className="py-12 text-center text-sage-500">Loading household pets...</div>;
  }

  if (pets.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center mx-auto mb-3 text-2xl">
          🐾
        </div>
        <h2 className="text-lg font-bold text-sage-800 mb-2">No Pets Registered</h2>
        <p className="text-xs text-sage-500 mb-6">
          You must add at least one pet to your household before you can post a care job.
        </p>
        <Link to="/pets/new" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4">
          <Plus className="w-4 h-4" /> Add a Pet
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/jobs')}
          className="p-2 rounded-xl text-sage-500 hover:text-sage-800 hover:bg-sage-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="section-title">Post a Care Job</h1>
          <p className="section-sub">Describe what care your pet needs and offer a fair rate.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Select Pet *</label>
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
          <label className="label">Job Title *</label>
          <input
            className="input"
            value={form.title}
            onChange={handleChange('title')}
            placeholder="e.g. Weekend Dog Sitting & Walking"
            required
          />
        </div>

        <div>
          <label className="label">Care Description *</label>
          <textarea
            className="input"
            rows={3}
            value={form.description}
            onChange={handleChange('description')}
            placeholder="Describe feeding habits, personality, medications, or any special instructions..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date *</label>
            <input
              className="input"
              type="date"
              value={form.start_at}
              onChange={handleChange('start_at')}
              required
            />
          </div>
          <div>
            <label className="label">End Date *</label>
            <input
              className="input"
              type="date"
              value={form.end_at}
              onChange={handleChange('end_at')}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Location *</label>
          <input
            className="input"
            value={form.location}
            onChange={handleChange('location')}
            placeholder="e.g. Indiranagar, Bengaluru"
            required
          />
        </div>

        <div>
          <label className="label">Offered Amount (₹) *</label>
          <input
            className="input"
            type="number"
            min="0"
            value={form.offered_amount_inr}
            onChange={handleChange('offered_amount_inr')}
            placeholder="e.g. 1200"
            required
          />
        </div>

        <div>
          <label className="label">Tasks (one per line) *</label>
          <textarea
            className="input"
            rows={3}
            value={form.tasks}
            onChange={handleChange('tasks')}
            placeholder={'Morning walk (30 min)\nBreakfast & fresh water\nEvening playtime'}
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Posting...' : 'Post Care Job'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="btn-outline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LiveCareJobs() {
  const { household } = useAuth();
  const [jobs, setJobs] = useState<LiveCareOpportunity[]>([]);
  const [pets, setPets] = useState<PetWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!household?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [householdPets, householdJobs] = await Promise.all([
        getPets(household.id),
        getLiveHouseholdJobs(household.id),
      ]);
      setPets(householdPets);
      setJobs(householdJobs);
    } catch (err) {
      console.error('Error loading care jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [household?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Care Jobs</h1>
          <p className="section-sub">
            Post jobs, review applicant caretakers, and manage active hires for your household.
          </p>
        </div>
        <Link to="/jobs/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Post Job
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sage-500">Loading your care jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-sage-400 card border-dashed">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40 text-sage-500" />
          <p className="font-semibold text-sage-700 mb-1">No care jobs posted yet</p>
          <p className="text-xs text-sage-500 mb-5 max-w-sm mx-auto">
            Need someone to walk your dog, feed your cat, or sit your pet? Post your first care job.
          </p>
          <Link to="/jobs/new" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4">
            <Plus className="w-4 h-4" /> Post a Job
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <LiveJobCard
              key={job.id}
              job={job}
              pets={pets}
              householdId={household!.id}
              onRefresh={loadData}
            />
          ))}
        </div>
      )}
    </div>
  );
}
