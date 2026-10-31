import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getLiveEarnings,
  markLiveEarningsPaid,
  type LiveEarningsEntry
} from '../../services/liveDataService';
import { IndianRupee, TrendingUp, Clock, CheckCircle, Wallet } from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'badge-yellow', label: '⏳ Pending Approval' },
    approved: { cls: 'badge-green', label: '✅ Approved' },
    marked_paid: { cls: 'badge-green', label: '💰 Paid' },
  };
  const c = cfg[status] ?? { cls: 'badge bg-gray-100 text-gray-500', label: status };
  return <span className={c.cls}>{c.label}</span>;
}

export default function LiveEarnings() {
  const { user, profile } = useAuth();
  const [earnings, setEarnings] = useState<LiveEarningsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const isCaretaker = profile?.role === 'caretaker';

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getLiveEarnings(user.id, isCaretaker);
      setEarnings(data);
    } catch (err) {
      console.error('Error loading earnings ledger:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isCaretaker]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkPaid = async (earningId: string) => {
    await markLiveEarningsPaid(earningId);
    loadData();
  };

  const total = earnings.reduce((sum, e) => sum + (Number(e.amount_inr) || 0), 0);
  const approved = earnings
    .filter(e => ['approved', 'marked_paid'].includes(e.status))
    .reduce((sum, e) => sum + (Number(e.amount_inr) || 0), 0);
  const pending = earnings
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + (Number(e.amount_inr) || 0), 0);
  const paid = earnings
    .filter(e => e.status === 'marked_paid')
    .reduce((sum, e) => sum + (Number(e.amount_inr) || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title">
          {isCaretaker ? '💰 My Caretaker Earnings' : '📊 Care Earnings Ledger'}
        </h1>
        <p className="section-sub">
          {isCaretaker
            ? 'Track completed care jobs, approval status, and payout history.'
            : 'View care fee allocations and payment statuses.'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-sage-600">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-sage-800">₹{total}</div>
            <div className="text-xs text-sage-500">Total Agreed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-sage-800">₹{approved}</div>
            <div className="text-xs text-sage-500">Approved</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-sage-800">₹{pending}</div>
            <div className="text-xs text-sage-500">Pending Approval</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-peach-100 flex items-center justify-center text-peach-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-sage-800">₹{paid}</div>
            <div className="text-xs text-sage-500">Settled</div>
          </div>
        </div>
      </div>

      {/* Earnings Entries List */}
      <div className="card">
        <h2 className="font-semibold text-sage-800 mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-sage-600" /> Payment Entries
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-sage-500">Loading ledger...</div>
        ) : earnings.length === 0 ? (
          <div className="text-center py-10 text-sage-400">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40 text-sage-500" />
            <p className="text-sm font-medium text-sage-600">No earnings recorded</p>
            <p className="text-xs text-sage-400">
              When care jobs are completed and approved, ledger entries will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {earnings.map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-sage-50/50 border border-sage-100 text-xs"
              >
                <div>
                  <div className="font-bold text-sage-800 text-sm">₹{entry.amount_inr}</div>
                  <div className="text-sage-400 text-[11px] mt-0.5">
                    Recorded: {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={entry.status} />
                  {entry.status === 'approved' && !isCaretaker && (
                    <button
                      onClick={() => handleMarkPaid(entry.id)}
                      className="btn-secondary text-[11px] py-1 px-2.5"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

