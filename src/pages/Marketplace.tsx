import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useApp } from '../context/AppContext';
import { MapPin, Calendar, IndianRupee, CheckCircle, Star, Search, Filter } from 'lucide-react';
import type { CareOpportunity } from '../types';

function JobCard({ job, caretakerId }: { job: CareOpportunity; caretakerId: string }) {
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const pets = useLiveQuery(() => db.pets.toArray(), []);
  const existing = useLiveQuery(() =>
    db.applications.where('opportunityId').equals(job.id).and(a => a.caretakerId === caretakerId).first()
  , [job.id, caretakerId]);
  const myAssignment = useLiveQuery(() =>
    db.assignments.where('opportunityId').equals(job.id).and(a => a.caretakerId === caretakerId).first()
  , [job.id, caretakerId]);

  const pet = pets?.find(p => p.id === job.petId);

  const apply = async () => {
    if (!message.trim()) return;
    const now = new Date().toISOString();
    await db.applications.add({
      id: crypto.randomUUID(),
      opportunityId: job.id,
      caretakerId,
      message: message.trim(),
      status: 'submitted',
      appliedAt: now,
      updatedAt: now,
    });
    setDone(true);
    setApplying(false);
  };

  const acceptAssignment = async () => {
    if (!myAssignment) return;
    const now = new Date().toISOString();
    await db.assignments.update(myAssignment.id, { status: 'accepted', acceptedAt: now, updatedAt: now });
  };

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {pet?.photoUrl && <img src={pet.photoUrl} alt={pet.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-sage-800">{job.title}</h3>
              <div className="text-sm text-sage-500 mt-0.5">{pet?.name} · {pet?.breed}</div>
            </div>
            <div className="flex items-center gap-1.5 bg-sage-50 px-3 py-1.5 rounded-xl">
              <IndianRupee className="w-3.5 h-3.5 text-sage-600" />
              <span className="font-bold text-sage-700">₹{job.offeredAmountINR}</span>
            </div>
          </div>

          <p className="text-sm text-sage-600 mt-3 leading-relaxed line-clamp-2">{job.description}</p>

          <div className="flex flex-wrap gap-3 mt-3 text-xs text-sage-500">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
              {new Date(job.startAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
              {new Date(job.endAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Tasks */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {job.tasks.map((t, i) => (
              <span key={i} className="badge bg-sage-50 text-sage-600">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="mt-4 pt-4 border-t border-sage-100">
        {myAssignment?.status === 'offered' && (
          <div className="bg-peach-50 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-peach-700 text-sm">🎉 You've been selected!</div>
              <div className="text-xs text-peach-500">Agreed amount: ₹{myAssignment.agreedAmountINR}</div>
            </div>
            <button onClick={acceptAssignment} className="btn-secondary text-sm py-2">Accept Assignment</button>
          </div>
        )}
        {myAssignment?.status === 'accepted' && (
          <div className="badge-green text-sm py-2 px-3 w-full justify-center">✅ Assignment Accepted — Check your dashboard</div>
        )}
        {(myAssignment?.status === 'in_progress') && (
          <div className="badge-peach text-sm py-2 px-3 w-full justify-center">🔄 In Progress — Complete tasks from your dashboard</div>
        )}
        {!myAssignment && !existing && !done && job.status === 'open' && (
          <>
            {applying ? (
              <div className="space-y-3">
                <textarea
                  className="input text-sm"
                  rows={3}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Introduce yourself and why you're a great fit for this job…"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={apply} disabled={!message.trim()} className="btn-primary text-sm flex-1">Send Application</button>
                  <button onClick={() => setApplying(false)} className="btn-outline text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setApplying(true)} className="btn-primary w-full text-sm">
                Apply for This Job
              </button>
            )}
          </>
        )}
        {(existing || done) && !myAssignment && (
          <div className="text-center">
            {existing?.status === 'submitted' && <div className="badge-blue py-2 px-4">✉️ Application Submitted — Waiting for owner review</div>}
            {existing?.status === 'selected' && <div className="badge-green py-2 px-4">🎉 Selected! Check your dashboard for assignment</div>}
            {existing?.status === 'rejected' && <div className="badge-red py-2 px-4">Application not selected this time</div>}
            {done && !existing && <div className="badge-blue py-2 px-4">✉️ Application Sent!</div>}
          </div>
        )}
        {job.status === 'filled' && !myAssignment && !existing && (
          <div className="text-center text-sage-400 text-sm">This position has been filled.</div>
        )}
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { caretakerId } = useApp();
  const [search, setSearch] = useState('');

  const jobs = useLiveQuery(() =>
    db.careOpportunities.filter(j => j.status === 'open').toArray()
  , []);

  const caretaker = useLiveQuery(() => db.caretakerProfiles.get(caretakerId), [caretakerId]);

  const filtered = jobs?.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.location.toLowerCase().includes(search.toLowerCase()) ||
    j.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title">Browse Care Jobs</h1>
        <p className="section-sub">Find opportunities to care for pets near you and earn.</p>
      </div>

      {/* Caretaker Profile Banner */}
      {caretaker && (
        <div className="card mb-6 bg-gradient-to-r from-peach-50 to-cream border-peach-100">
          <div className="flex items-center gap-4">
            <img src={caretaker.photoUrl} alt={caretaker.displayName} className="w-14 h-14 rounded-full object-cover" />
            <div>
              <div className="font-bold text-sage-800">{caretaker.displayName}</div>
              <div className="text-sm text-sage-500">{caretaker.experienceYears} yrs experience · {caretaker.skills.slice(0, 3).join(', ')}</div>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-sage-700">{caretaker.rating}</span>
                <span className="text-xs text-sage-400">· {caretaker.completedJobs} completed jobs</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
        <input
          className="input pl-10"
          placeholder="Search jobs by title, location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-5">
        {filtered?.map(job => <JobCard key={job.id} job={job} caretakerId={caretakerId} />)}
        {filtered?.length === 0 && (
          <div className="text-center py-16 text-sage-400">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="font-medium text-sage-600">No open jobs found</p>
            <p className="text-sm mt-1">Try a different search or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}

