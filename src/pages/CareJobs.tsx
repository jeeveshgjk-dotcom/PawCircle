import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { useApp } from '../context/AppContext';
import {
  Plus, MapPin, Calendar, IndianRupee, Users, ChevronDown,
  ChevronUp, CheckCircle, XCircle, ArrowLeft, Clock, Briefcase,
} from 'lucide-react';
import type { CareOpportunity, Application } from '../types';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    open: { cls: 'badge-green', label: 'Open' },
    filled: { cls: 'badge-peach', label: 'Filled' },
    closed: { cls: 'badge bg-gray-100 text-gray-500', label: 'Closed' },
    submitted: { cls: 'badge-blue', label: 'Applied' },
    selected: { cls: 'badge-green', label: 'Selected ✓' },
    rejected: { cls: 'badge-red', label: 'Rejected' },
    in_progress: { cls: 'badge-peach', label: 'In Progress' },
    submitted_for_review: { cls: 'badge-blue', label: 'Under Review' },
    approved: { cls: 'badge-green', label: 'Approved ✓' },
    pending: { cls: 'badge-yellow', label: 'Pending Approval' },
    marked_paid: { cls: 'badge-green', label: 'Demo Paid ✓' },
  };
  const c = cfg[status] ?? { cls: 'badge bg-gray-100 text-gray-500', label: status };
  return <span className={c.cls}>{c.label}</span>;
}

function JobCard({ job }: { job: CareOpportunity }) {
  const [expanded, setExpanded] = useState(false);
  const pets = useLiveQuery(() => db.pets.toArray(), []);
  const applications = useLiveQuery(() => db.applications.where('opportunityId').equals(job.id).toArray(), [job.id]);
  const assignments = useLiveQuery(() => db.assignments.where('opportunityId').equals(job.id).toArray(), [job.id]);
  const tasks = useLiveQuery(() => db.careTasks.where('assignmentId').anyOf(assignments?.map(a => a.id) ?? []).toArray(), [assignments]);
  const earnings = useLiveQuery(() => db.earningsEntries.where('assignmentId').anyOf(assignments?.map(a => a.id) ?? []).toArray(), [assignments]);

  const pet = pets?.find(p => p.id === job.petId);
  const assignment = assignments?.[0];
  const earning = earnings?.[0];
  const completedTasks = tasks?.filter(t => t.status === 'completed') ?? [];
  const pendingTasks = tasks?.filter(t => t.status === 'pending') ?? [];

  const selectApplicant = async (app: Application) => {
    const now = new Date().toISOString();
    // Reject others
    const others = applications?.filter(a => a.id !== app.id) ?? [];
    for (const o of others) await db.applications.update(o.id, { status: 'rejected', updatedAt: now });
    // Select this one
    await db.applications.update(app.id, { status: 'selected', updatedAt: now });
    // Create assignment
    const assignId = crypto.randomUUID();
    await db.assignments.add({
      id: assignId,
      opportunityId: job.id,
      caretakerId: app.caretakerId,
      applicationId: app.id,
      agreedAmountINR: job.offeredAmountINR,
      status: 'offered',
      createdAt: now,
      updatedAt: now,
    });
    // Create tasks
    for (const task of job.tasks) {
      await db.careTasks.add({
        id: crypto.randomUUID(),
        petId: job.petId,
        assignmentId: assignId,
        title: task,
        dueAt: job.startAt,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
    }
    // Create earnings entry
    await db.earningsEntries.add({
      id: crypto.randomUUID(),
      assignmentId: assignId,
      caretakerId: app.caretakerId,
      amountINR: job.offeredAmountINR,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    // Mark job filled
    await db.careOpportunities.update(job.id, { status: 'filled', updatedAt: now });
  };

  const approveWork = async () => {
    if (!assignment || !earning) return;
    const now = new Date().toISOString();
    await db.assignments.update(assignment.id, { status: 'approved', updatedAt: now });
    await db.earningsEntries.update(earning.id, { status: 'approved', approvedAt: now, updatedAt: now });
  };

  const markPaid = async () => {
    if (!earning) return;
    const now = new Date().toISOString();
    await db.earningsEntries.update(earning.id, { status: 'marked_paid', markedPaidAt: now, updatedAt: now });
  };

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        {pet?.photoUrl && <img src={pet.photoUrl} alt={pet.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-sage-800">{job.title}</h3>
              <div className="text-sm text-sage-500">{pet?.name} · {pet?.species}</div>
            </div>
            <StatusBadge status={job.status} />
          </div>

          <div className="flex flex-wrap gap-3 mt-3 text-xs text-sage-500">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(job.startAt).toLocaleDateString()} – {new Date(job.endAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1 font-semibold text-sage-700"><IndianRupee className="w-3 h-3" />₹{job.offeredAmountINR}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{applications?.length ?? 0} applicant{applications?.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 w-full flex items-center justify-center gap-1 text-xs text-sage-400 hover:text-sage-600 py-1"
      >
        {expanded ? <><ChevronUp className="w-3 h-3" /> Hide details</> : <><ChevronDown className="w-3 h-3" /> Show details & applicants</>}
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-sage-100 space-y-5">
          <p className="text-sm text-sage-600">{job.description}</p>

          {/* Tasks */}
          <div>
            <div className="text-xs font-semibold text-sage-600 uppercase tracking-wide mb-2">Tasks</div>
            <ul className="space-y-1">
              {job.tasks.map((t, i) => <li key={i} className="text-sm text-sage-600 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-sage-400 flex-shrink-0" />{t}</li>)}
            </ul>
          </div>

          {/* Assignment Progress */}
          {assignment && (
            <div className="bg-sage-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-sage-600 uppercase tracking-wide mb-3">Assignment Progress</div>
              <div className="flex gap-3 mb-3">
                <StatusBadge status={assignment.status} />
                {earning && <StatusBadge status={earning.status} />}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="font-bold text-green-600">{completedTasks.length}</div>
                  <div className="text-xs text-sage-400">Completed</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="font-bold text-yellow-600">{pendingTasks.length}</div>
                  <div className="text-xs text-sage-400">Pending</div>
                </div>
              </div>

              {/* Task list with completion status */}
              <div className="space-y-1 mb-4">
                {tasks?.map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    {task.status === 'completed'
                      ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      : <Clock className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                    <span className={task.status === 'completed' ? 'line-through text-sage-400' : 'text-sage-700'}>{task.title}</span>
                    {task.notes && <span className="text-xs text-sage-400 ml-auto">📝 {task.notes}</span>}
                  </div>
                ))}
              </div>

              {/* Approval buttons */}
              {assignment.status === 'submitted_for_review' && earning?.status === 'pending' && (
                <button onClick={approveWork} className="btn-primary w-full text-sm">
                  ✅ Approve Work & Release ₹{earning.amountINR} (Demo)
                </button>
              )}
              {earning?.status === 'approved' && (
                <button onClick={markPaid} className="btn-secondary w-full text-sm">
                  💰 Mark as Demo-Paid (Simulation Only)
                </button>
              )}
              {earning?.status === 'marked_paid' && (
                <div className="text-center text-sm text-sage-500 bg-green-50 rounded-lg py-2">✅ Payment marked in demo ledger</div>
              )}
            </div>
          )}

          {/* Applicants */}
          {(applications?.length ?? 0) > 0 && !assignment && (
            <div>
              <div className="text-xs font-semibold text-sage-600 uppercase tracking-wide mb-3">Applicants</div>
              <div className="space-y-3">
                {applications?.map(app => (
                  <ApplicantRow key={app.id} app={app} offeredAmount={job.offeredAmountINR} onSelect={selectApplicant} />
                ))}
              </div>
            </div>
          )}

          {job.status === 'open' && (applications?.length ?? 0) === 0 && (
            <div className="text-center py-4 text-sage-400 text-sm">No applications yet. Share the job link with potential caretakers!</div>
          )}
        </div>
      )}
    </div>
  );
}

function ApplicantRow({ app, offeredAmount, onSelect }: { app: Application; offeredAmount: number; onSelect: (a: Application) => void }) {
  const caretaker = useLiveQuery(() => db.caretakerProfiles.get(app.caretakerId), [app.caretakerId]);

  return (
    <div className="bg-sage-50 rounded-xl p-3">
      <div className="flex items-start gap-3">
        {caretaker?.photoUrl && <img src={caretaker.photoUrl} alt={caretaker.displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sage-800 text-sm">{caretaker?.displayName ?? 'Caretaker'}</div>
          <div className="text-xs text-sage-400">{caretaker?.experienceYears} yrs exp · {caretaker?.skills?.slice(0, 2).join(', ')}</div>
          <p className="text-sm text-sage-600 mt-1.5">{app.message}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>
      {app.status === 'submitted' && (
        <div className="flex gap-2 mt-3">
          <button onClick={() => onSelect(app)} className="btn-primary text-xs py-1.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Select (₹{offeredAmount})
          </button>
          <button onClick={async () => {
            await db.applications.update(app.id, { status: 'rejected', updatedAt: new Date().toISOString() });
          }} className="btn-outline text-xs py-1.5 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

export function PostJobForm() {
  const { householdId } = useApp();
  const navigate = useNavigate();
  const pets = useLiveQuery(() => db.pets.where('householdId').equals(householdId).toArray(), [householdId]);

  const [form, setForm] = useState({
    petId: '', title: '', description: '', startAt: '', endAt: '',
    location: '', offeredAmountINR: '', tasks: '',
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    await db.careOpportunities.add({
      id: crypto.randomUUID(),
      ownerHouseholdId: householdId,
      petId: form.petId,
      title: form.title,
      description: form.description,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      location: form.location,
      offeredAmountINR: Number(form.offeredAmountINR),
      status: 'open',
      tasks: form.tasks.split('\n').filter(t => t.trim()),
      createdAt: now,
      updatedAt: now,
    });
    navigate('/jobs');
  };

  return (
    <div className="max-w-xl">
      <Link to="/jobs" className="flex items-center gap-2 text-sage-500 hover:text-sage-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </Link>
      <h1 className="section-title">Post a Care Job</h1>
      <p className="section-sub">Describe what your pet needs and receive applications from caretakers.</p>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Select Pet *</label>
          <select className="input" value={form.petId} onChange={set('petId')} required>
            <option value="">Choose a pet…</option>
            {pets?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Job Title *</label>
          <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Weekend Care for Bruno" required />
        </div>
        <div>
          <label className="label">Description *</label>
          <textarea className="input" rows={3} value={form.description} onChange={set('description')} placeholder="Describe what you need, your pet's personality, any special requirements…" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date *</label>
            <input className="input" type="date" value={form.startAt} onChange={set('startAt')} required />
          </div>
          <div>
            <label className="label">End Date *</label>
            <input className="input" type="date" value={form.endAt} onChange={set('endAt')} required />
          </div>
        </div>
        <div>
          <label className="label">Location *</label>
          <input className="input" value={form.location} onChange={set('location')} placeholder="e.g. Koramangala, Bengaluru" required />
        </div>
        <div>
          <label className="label">Offered Amount (₹) *</label>
          <input className="input" type="number" min="0" value={form.offeredAmountINR} onChange={set('offeredAmountINR')} placeholder="e.g. 800" required />
        </div>
        <div>
          <label className="label">Tasks (one per line) *</label>
          <textarea className="input" rows={4} value={form.tasks} onChange={set('tasks')}
            placeholder={'Morning walk (30 min)\nBreakfast feeding\nEvening walk'} required />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1">Post Job</button>
          <button type="button" onClick={() => navigate('/jobs')} className="btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function CareJobs() {
  const { householdId } = useApp();
  const jobs = useLiveQuery(() => db.careOpportunities.where('ownerHouseholdId').equals(householdId).reverse().toArray(), [householdId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Care Jobs</h1>
          <p className="section-sub">Post jobs, review applicants, and manage hired caretakers.</p>
        </div>
        <Link to="/jobs/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Post Job
        </Link>
      </div>

      <div className="space-y-5">
        {jobs?.map(job => <JobCard key={job.id} job={job} />)}
        {jobs?.length === 0 && (
          <div className="text-center py-16 text-sage-400">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-sage-600 mb-1">No care jobs yet</p>
            <p className="text-sm mb-5">Post your first job to find a caretaker.</p>
            <Link to="/jobs/new" className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Post a Job</Link>
          </div>
        )}
      </div>
    </div>
  );
}

