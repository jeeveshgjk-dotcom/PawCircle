import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Clock, Briefcase, Star, UserCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getLiveEarnings,
  getLiveOpenJobs,
  type LiveEarningsEntry,
  type LiveCareOpportunity
} from '../services/liveDataService';

export default function CaretakerDashboard() {
  const { user, profile } = useAuth();
  const [earnings, setEarnings] = useState<LiveEarningsEntry[]>([]);
  const [openJobs, setOpenJobs] = useState<LiveCareOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Caretaker';

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [earn, jobs] = await Promise.all([
        getLiveEarnings(user.id, true),
        getLiveOpenJobs(),
      ]);
      setEarnings(earn);
      setOpenJobs(jobs);
    } catch (err) {
      console.error('Error loading caretaker dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const approvedEarnings = earnings
    .filter(e => ['approved', 'marked_paid'].includes(e.status))
    .reduce((sum, e) => sum + (Number(e.amount_inr) || 0), 0);

  const pendingEarnings = earnings
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + (Number(e.amount_inr) || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title">🐾 Caretaker Dashboard</h1>
        <p className="section-sub">Welcome back, {displayName}! Your personal caretaker overview.</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-sage-800">₹{approvedEarnings}</div>
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
            <div className="text-xl font-bold text-sage-800">{earnings.length}</div>
            <div className="text-xs text-sage-500">Assignments</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-peach-100 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-peach-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-sage-800">{openJobs.length}</div>
            <div className="text-xs text-sage-500">Available Jobs</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Marketplace Opportunities preview */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sage-800 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-sage-600" /> Available Care Jobs
              </h2>
              <Link to="/marketplace" className="text-xs font-semibold text-sage-600 hover:text-sage-800 flex items-center gap-1">
                Browse All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-sage-500">Loading open jobs...</div>
            ) : openJobs.length === 0 ? (
              <div className="text-center py-8 bg-sage-50/40 rounded-xl border border-dashed border-sage-200">
                <p className="text-xs text-sage-500 mb-2">No open care jobs currently posted in marketplace.</p>
                <p className="text-[11px] text-sage-400">
                  New pet sitting, walking, and care opportunities posted by local pet owners will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {openJobs.slice(0, 3).map(j => (
                  <Link
                    key={j.id}
                    to="/marketplace"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-sage-50 transition-colors border border-sage-100 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-sage-800">{j.title}</div>
                      <div className="text-sage-400 text-[11px] mt-0.5">
                        {j.location} • ₹{j.offered_amount_inr}
                      </div>
                    </div>
                    <span className="btn-secondary text-[10px] py-1 px-2.5">View & Apply</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Active Assignments List */}
          <div className="card">
            <h2 className="font-semibold text-sage-800 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sage-600" /> My Assignments & Payouts
            </h2>
            {earnings.length === 0 ? (
              <div className="text-center py-6 text-sage-400 text-xs">
                You haven't been assigned any care jobs yet. Browse the marketplace to apply!
              </div>
            ) : (
              <div className="space-y-2">
                {earnings.map(e => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-sage-50/40 text-xs"
                  >
                    <span className="font-semibold text-sage-800">₹{e.amount_inr}</span>
                    <span className="badge-green capitalize text-[10px]">{e.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="card">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="font-bold text-sage-800">{displayName}</div>
              <div className="text-xs text-sage-500 mt-0.5">{user?.email}</div>
              <span className="badge-green text-[10px] mt-2">Active Caretaker</span>
            </div>

            {profile?.bio && (
              <p className="text-xs text-sage-600 mb-3 text-center italic">
                "{profile.bio}"
              </p>
            )}

            <div className="space-y-2 pt-2 border-t border-sage-100">
              <Link
                to="/marketplace"
                className="btn-primary w-full text-xs py-2 text-center block"
              >
                Browse Care Jobs
              </Link>
              <Link
                to="/profile"
                className="btn-outline w-full text-xs py-2 text-center block"
              >
                Edit Caretaker Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
