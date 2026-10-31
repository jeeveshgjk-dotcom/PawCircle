import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getLiveOpenJobs,
  applyToLiveJob,
  getLiveJobApplications,
  type LiveCareOpportunity,
  type LiveApplication
} from '../../services/liveDataService';
import {
  MapPin, Calendar, IndianRupee, Search,
  ShoppingBag, Send, AlertCircle
} from 'lucide-react';

function MarketplaceJobCard({
  job,
  userId,
  caretakerName,
}: {
  job: LiveCareOpportunity;
  userId: string;
  caretakerName: string;
}) {
  const [applications, setApplications] = useState<LiveApplication[]>([]);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    getLiveJobApplications(job.id).then(setApplications);
  }, [job.id]);

  const myApp = applications.find(a => a.caretaker_id === userId);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const created = await applyToLiveJob(userId, job.id, message.trim(), caretakerName);
      setApplications(prev => [...prev, created]);
      setApplying(false);
      setMessage('');
      setApplySuccess(true);
    } catch (err) {
      console.error('Failed to apply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        {job.pet_photo_url ? (
          <img
            src={job.pet_photo_url}
            alt={job.pet_name || 'Pet'}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-sage-100 flex items-center justify-center text-2xl flex-shrink-0">
            🐾
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
            <div>
              <h3 className="font-bold text-sage-800 text-base">{job.title}</h3>
              <div className="text-xs text-sage-500 font-medium mt-0.5">
                {job.pet_name || 'Pet'} {job.pet_breed || job.pet_species ? `• ${job.pet_breed || job.pet_species}` : ''}
                {job.owner_name ? ` • Posted by ${job.owner_name}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
              <IndianRupee className="w-3.5 h-3.5 text-green-700" />
              <span className="font-bold text-green-800 text-sm">₹{job.offered_amount_inr}</span>
            </div>
          </div>

          <p className="text-xs text-sage-600 mt-2 leading-relaxed">{job.description}</p>

          <div className="flex flex-wrap gap-4 text-xs text-sage-500 my-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(job.start_at).toLocaleDateString()} – {new Date(job.end_at).toLocaleDateString()}
            </span>
          </div>

          {job.tasks && job.tasks.length > 0 && (
            <div className="mb-3">
              <div className="text-[11px] font-semibold text-sage-600 uppercase mb-1.5">
                Tasks Required:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.tasks.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs bg-sage-50 text-sage-700 px-2.5 py-1 rounded-lg border border-sage-100"
                  >
                    ✓ {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action / Application Status */}
          <div className="pt-3 border-t border-sage-100 flex items-center justify-between">
            {myApp ? (
              <div className="flex items-center gap-2">
                <span
                  className={
                    myApp.status === 'selected'
                      ? 'badge-green text-xs'
                      : 'badge-blue text-xs'
                  }
                >
                  {myApp.status === 'selected' ? 'Selected by Owner ✓' : 'Application Submitted ✓'}
                </span>
                <span className="text-[11px] text-sage-400">
                  Applied on {new Date(myApp.applied_at).toLocaleDateString()}
                </span>
              </div>
            ) : applying ? (
              <form onSubmit={handleApply} className="w-full space-y-2 mt-2">
                <input
                  className="input text-xs"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Introduce yourself and your experience with pets..."
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Submitting...' : 'Send Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplying(false)}
                    className="btn-outline text-xs py-1.5 px-3"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between w-full">
                {applySuccess && (
                  <span className="text-xs text-green-700 font-medium">Application sent to owner!</span>
                )}
                <button
                  onClick={() => setApplying(true)}
                  className="btn-primary text-xs py-2 px-4 ml-auto"
                >
                  Apply for this Care Opportunity
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveMarketplace() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<LiveCareOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const openJobs = await getLiveOpenJobs();
      setJobs(openJobs);
    } catch (err) {
      console.error('Error loading marketplace:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Caretaker';

  const filteredJobs = query
    ? jobs.filter(
        j =>
          j.title.toLowerCase().includes(query.toLowerCase()) ||
          j.location.toLowerCase().includes(query.toLowerCase()) ||
          (j.pet_name && j.pet_name.toLowerCase().includes(query.toLowerCase()))
      )
    : jobs;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="section-title">Care Marketplace</h1>
          <p className="section-sub">
            Browse open pet care opportunities posted by local pet owners.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-sage-400 absolute left-3 top-3" />
          <input
            className="input pl-9 text-xs py-2"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search location, pet, or title..."
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sage-500">Loading marketplace opportunities...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 text-sage-400 card border-dashed">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40 text-sage-500" />
          <p className="font-semibold text-sage-700 mb-1">No open care jobs currently</p>
          <p className="text-xs text-sage-500 max-w-sm mx-auto">
            {query
              ? 'No jobs match your search criteria. Try a different search.'
              : 'When pet owners post paid care opportunities in your area, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => (
            <MarketplaceJobCard
              key={job.id}
              job={job}
              userId={user?.id || ''}
              caretakerName={displayName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
