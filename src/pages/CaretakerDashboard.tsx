import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useApp } from '../context/AppContext';
import { CheckCircle, Clock, MessageSquare, IndianRupee, Briefcase, Star, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    offered: 'badge-yellow', accepted: 'badge-blue', in_progress: 'badge-peach',
    submitted_for_review: 'badge-blue', approved: 'badge-green', cancelled: 'badge-red',
    pending: 'badge-yellow', marked_paid: 'badge-green',
  };
  const labels: Record<string, string> = {
    offered: 'Offered', accepted: 'Accepted', in_progress: 'In Progress',
    submitted_for_review: 'Under Review', approved: 'Approved ✓', cancelled: 'Cancelled',
    pending: 'Pending Approval', marked_paid: '💰 Demo Paid',
  };
  return <span className={cfg[status] ?? 'badge bg-gray-100 text-gray-500'}>{labels[status] ?? status}</span>;
}

export default function CaretakerDashboard() {
  const { caretakerId } = useApp();

  const caretaker = useLiveQuery(() => db.caretakerProfiles.get(caretakerId), [caretakerId]);
  const applications = useLiveQuery(() => db.applications.where('caretakerId').equals(caretakerId).toArray(), [caretakerId]);
  const assignments = useLiveQuery(() => db.assignments.where('caretakerId').equals(caretakerId).toArray(), [caretakerId]);
  const earnings = useLiveQuery(() => db.earningsEntries.where('caretakerId').equals(caretakerId).toArray(), [caretakerId]);

  const activeAssignment = assignments?.find(a => ['accepted', 'in_progress', 'offered'].includes(a.status));
  const tasks = useLiveQuery(async (): Promise<import('../types').CareTask[]> =>
    activeAssignment ? db.careTasks.where('assignmentId').equals(activeAssignment.id).toArray() : []
  , [activeAssignment?.id]);

  const opportunity = useLiveQuery(async (): Promise<import('../types').CareOpportunity | undefined> =>
    activeAssignment ? db.careOpportunities.get(activeAssignment.opportunityId) : undefined
  , [activeAssignment?.opportunityId]);

  const pet = useLiveQuery(async (): Promise<import('../types').Pet | undefined> =>
    opportunity ? db.pets.get(opportunity.petId) : undefined
  , [opportunity?.petId]);

  const totalEarnings = earnings?.filter(e => ['approved', 'marked_paid'].includes(e.status)).reduce((s, e) => s + e.amountINR, 0) ?? 0;
  const pendingEarnings = earnings?.filter(e => e.status === 'pending').reduce((s, e) => s + e.amountINR, 0) ?? 0;

  const completeTask = async (taskId: string) => {
    const now = new Date().toISOString();
    const notes = prompt('Add a completion note (optional):') ?? '';
    await db.careTasks.update(taskId, { status: 'completed', completedAt: now, completedBy: caretakerId, notes, updatedAt: now });

    // Check if all tasks done → update assignment
    if (activeAssignment) {
      const allTasks = await db.careTasks.where('assignmentId').equals(activeAssignment.id).toArray();
      const allDone = allTasks.every(t => t.id === taskId || t.status === 'completed');
      if (allDone) {
        await db.assignments.update(activeAssignment.id, { status: 'submitted_for_review', updatedAt: now });
      } else {
        await db.assignments.update(activeAssignment.id, { status: 'in_progress', updatedAt: now });
      }
    }
  };

  const acceptAssignment = async (id: string) => {
    const now = new Date().toISOString();
    await db.assignments.update(id, { status: 'accepted', acceptedAt: now, updatedAt: now });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title">🐾 Caretaker Dashboard</h1>
        <p className="section-sub">Welcome back, {caretaker?.displayName ?? 'Riya'}! Here's your work overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-sage-800">₹{totalEarnings}</div>
            <div className="text-xs text-sage-500">Approved Earnings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-sage-800">₹{pendingEarnings}</div>
            <div className="text-xs text-sage-500">Pending Approval</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-sage-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-sage-800">{assignments?.length ?? 0}</div>
            <div className="text-xs text-sage-500">Total Assignments</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-sage-800">{caretaker?.rating ?? '—'}</div>
            <div className="text-xs text-sage-500">Rating</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assignment */}
          {activeAssignment && (
            <div className="card border-l-4 border-l-peach-400">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sage-800">Active Assignment</h2>
                <StatusBadge status={activeAssignment.status} />
              </div>

              {activeAssignment.status === 'offered' && (
                <div className="bg-peach-50 rounded-xl p-4 mb-4 text-center">
                  <div className="text-peach-700 font-semibold mb-1">🎉 You've been selected!</div>
                  <div className="text-sm text-peach-500 mb-3">Agreed amount: ₹{activeAssignment.agreedAmountINR}</div>
                  <button onClick={() => acceptAssignment(activeAssignment.id)} className="btn-secondary">
                    Accept Assignment
                  </button>
                </div>
              )}

              {pet && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-sage-50 rounded-xl">
                  {pet.photoUrl && <img src={pet.photoUrl} alt={pet.name} className="w-12 h-12 rounded-xl object-cover" />}
                  <div>
                    <div className="font-semibold text-sage-800">{pet.name}</div>
                    <div className="text-sm text-sage-500">{pet.breed}</div>
                    {pet.notes && <div className="text-xs text-sage-400 mt-1 line-clamp-1">📝 {pet.notes}</div>}
                  </div>
                </div>
              )}

              {opportunity && (
                <div className="mb-4">
                  <div className="font-medium text-sage-700 text-sm mb-1">{opportunity.title}</div>
                  <div className="text-xs text-sage-400">₹{activeAssignment.agreedAmountINR} agreed</div>
                </div>
              )}

              {/* Tasks */}
              <div>
                <div className="text-xs font-semibold text-sage-600 uppercase tracking-wide mb-3">Your Tasks</div>
                <div className="space-y-2">
                  {tasks?.map(task => (
                    <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border ${task.status === 'completed' ? 'bg-green-50 border-green-100' : 'bg-white border-sage-100'}`}>
                      {task.status === 'completed'
                        ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        : <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-sage-400' : 'text-sage-800'}`}>{task.title}</div>
                        {task.notes && <div className="text-xs text-sage-400 mt-0.5">📝 {task.notes}</div>}
                        {task.completedAt && <div className="text-xs text-green-500 mt-0.5">Completed {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                      </div>
                      {task.status === 'pending' && (activeAssignment.status === 'accepted' || activeAssignment.status === 'in_progress') && (
                        <button onClick={() => completeTask(task.id)} className="btn-primary text-xs py-1.5 px-3 flex-shrink-0">
                          Mark Done
                        </button>
                      )}
                    </div>
                  ))}
                  {!tasks?.length && <div className="text-sm text-sage-400 text-center py-2">No tasks yet</div>}
                </div>
              </div>

              {activeAssignment.status === 'submitted_for_review' && (
                <div className="mt-4 bg-blue-50 rounded-xl p-4 text-center">
                  <div className="font-semibold text-blue-700 text-sm">✅ All tasks submitted for review!</div>
                  <div className="text-xs text-blue-500 mt-1">Waiting for owner to approve your work and release ₹{activeAssignment.agreedAmountINR}</div>
                </div>
              )}
            </div>
          )}

          {!activeAssignment && (
            <div className="card text-center py-10">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-sage-300" />
              <p className="font-medium text-sage-600 mb-1">No active assignment</p>
              <p className="text-sm text-sage-400 mb-4">Browse open jobs and apply to get started.</p>
              <Link to="/marketplace" className="btn-primary inline-flex items-center gap-2">Browse Jobs</Link>
            </div>
          )}

          {/* All Applications */}
          <div className="card">
            <h2 className="font-semibold text-sage-800 mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> My Applications</h2>
            <div className="space-y-3">
              {applications?.map(app => {
                return <ApplicationRow key={app.id} app={app} />;
              })}
              {!applications?.length && <div className="text-sm text-sage-400 text-center py-3">No applications yet. <Link to="/marketplace" className="text-sage-600 underline">Browse jobs</Link></div>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Earnings Summary */}
          <div className="card">
            <h3 className="font-semibold text-sage-800 text-sm mb-4 flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Earnings (Demo)</h3>
            <div className="space-y-2">
              {earnings?.map(e => (
                <div key={e.id} className="flex items-center justify-between p-2 bg-sage-50 rounded-lg">
                  <span className="text-sm font-medium text-sage-700">₹{e.amountINR}</span>
                  <StatusBadge status={e.status} />
                </div>
              ))}
              {!earnings?.length && <div className="text-xs text-sage-400 text-center">No earnings yet</div>}
            </div>
            <div className="mt-4 pt-3 border-t border-sage-100">
              <div className="text-xs text-sage-400">⚡ Simulated demo only — no real money</div>
            </div>
          </div>

          {/* Caretaker Profile */}
          {caretaker && (
            <div className="card">
              <div className="text-center mb-4">
                <img src={caretaker.photoUrl} alt={caretaker.displayName} className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />
                <div className="font-bold text-sage-800">{caretaker.displayName}</div>
                <div className="flex items-center gap-1 justify-center mt-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm">{caretaker.rating} · {caretaker.completedJobs} jobs</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {caretaker.skills.map(s => <span key={s} className="badge-green">{s}</span>)}
              </div>
              <div className="mt-3 text-xs text-sage-500 text-center">{caretaker.availability}</div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-sage-800 text-sm mb-3">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/marketplace" className="flex items-center gap-2 text-sm text-sage-600 hover:text-sage-800 px-2 py-2 rounded-lg hover:bg-sage-50">🔍 Browse Jobs</Link>
              <Link to="/earnings" className="flex items-center gap-2 text-sm text-sage-600 hover:text-sage-800 px-2 py-2 rounded-lg hover:bg-sage-50">₹ Full Earnings</Link>
              <Link to="/schedule" className="flex items-center gap-2 text-sm text-sage-600 hover:text-sage-800 px-2 py-2 rounded-lg hover:bg-sage-50">📅 My Schedule</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationRow({ app }: { app: import('../types').Application }) {
  const opportunity = useLiveQuery(() => db.careOpportunities.get(app.opportunityId), [app.opportunityId]);
  const cfg: Record<string, string> = {
    submitted: 'badge-blue', selected: 'badge-green', rejected: 'badge-red', withdrawn: 'badge bg-gray-100 text-gray-500',
  };
  const label: Record<string, string> = { submitted: 'Applied', selected: 'Selected ✓', rejected: 'Not Selected', withdrawn: 'Withdrawn' };
  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-sage-50 rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-sage-800">{opportunity?.title ?? '…'}</div>
        <div className="text-xs text-sage-400 mt-0.5">₹{opportunity?.offeredAmountINR} · Applied {new Date(app.appliedAt).toLocaleDateString()}</div>
      </div>
      <span className={cfg[app.status] ?? 'badge bg-gray-100 text-gray-500'}>{label[app.status] ?? app.status}</span>
    </div>
  );
}
