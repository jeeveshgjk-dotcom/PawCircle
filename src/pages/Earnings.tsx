import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useApp } from '../context/AppContext';
import { IndianRupee, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'badge-yellow', label: '⏳ Pending Approval' },
    approved: { cls: 'badge-green', label: '✅ Approved' },
    marked_paid: { cls: 'badge-green', label: '💰 Demo Paid' },
  };
  const c = cfg[status] ?? { cls: 'badge bg-gray-100 text-gray-500', label: status };
  return <span className={c.cls}>{c.label}</span>;
}

export default function Earnings() {
  const { role, caretakerId } = useApp();
  const isCaretaker = role === 'caretaker';

  const earnings = useLiveQuery(() =>
    isCaretaker
      ? db.earningsEntries.where('caretakerId').equals(caretakerId).toArray()
      : db.earningsEntries.toArray()
  , [isCaretaker, caretakerId]);

  const assignments = useLiveQuery(() => db.assignments.toArray(), []);
  const opportunities = useLiveQuery(() => db.careOpportunities.toArray(), []);
  const pets = useLiveQuery(() => db.pets.toArray(), []);
  const caretaker = useLiveQuery(() => db.caretakerProfiles.get(caretakerId), [caretakerId]);

  const total = earnings?.reduce((s, e) => s + e.amountINR, 0) ?? 0;
  const approved = earnings?.filter(e => ['approved', 'marked_paid'].includes(e.status)).reduce((s, e) => s + e.amountINR, 0) ?? 0;
  const pending = earnings?.filter(e => e.status === 'pending').reduce((s, e) => s + e.amountINR, 0) ?? 0;
  const paid = earnings?.filter(e => e.status === 'marked_paid').reduce((s, e) => s + e.amountINR, 0) ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title">
          {isCaretaker ? '💰 My Earnings' : '📊 Earnings Ledger'}
        </h1>
        <p className="section-sub">
          {isCaretaker
            ? 'Track your agreed amounts, approval status, and demo-paid history.'
            : 'View all pending approvals and payment statuses.'}
        </p>
      </div>

      <div className="bg-peach-50 border border-peach-200 rounded-xl p-4 mb-6 text-sm text-peach-700">
        ⚡ <strong>Simulation only.</strong> No real money is transferred. This ledger is for demo purposes only. All amounts are fictional.
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Agreed', value: total, icon: IndianRupee, color: 'bg-sage-100 text-sage-600' },
          { label: 'Approved', value: approved, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
          { label: 'Pending', value: pending, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
          { label: 'Demo Paid', value: paid, icon: TrendingUp, color: 'bg-peach-100 text-peach-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-sage-800">₹{value}</div>
              <div className="text-xs text-sage-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Earnings Table */}
      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-sage-800 mb-4">Earnings History</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sage-100">
              <th className="text-left py-2 px-3 text-xs font-semibold text-sage-500 uppercase tracking-wide">Job</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-sage-500 uppercase tracking-wide">Pet</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-sage-500 uppercase tracking-wide">Amount</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-sage-500 uppercase tracking-wide">Status</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-sage-500 uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-50">
            {earnings?.map(e => {
              const assignment = assignments?.find(a => a.id === e.assignmentId);
              const opportunity = opportunities?.find(o => o.id === assignment?.opportunityId);
              const pet = pets?.find(p => p.id === opportunity?.petId);
              return (
                <tr key={e.id} className="hover:bg-sage-50 transition-colors">
                  <td className="py-3 px-3 font-medium text-sage-800">{opportunity?.title ?? '—'}</td>
                  <td className="py-3 px-3 text-sage-500">{pet?.name ?? '—'}</td>
                  <td className="py-3 px-3 text-right font-bold text-sage-700">₹{e.amountINR}</td>
                  <td className="py-3 px-3 text-center"><StatusBadge status={e.status} /></td>
                  <td className="py-3 px-3 text-right text-sage-400 text-xs">{new Date(e.createdAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!earnings?.length && (
          <div className="text-center py-10 text-sage-400">
            <IndianRupee className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No earnings entries yet.</p>
          </div>
        )}
      </div>

      {isCaretaker && (
        <div className="mt-4 card bg-sage-50">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-medium text-sage-700 text-sm">How earnings work</div>
              <ol className="text-xs text-sage-500 mt-1 space-y-1 list-decimal ml-4">
                <li>Complete all assigned tasks and submit for review</li>
                <li>Owner reviews your work and approves the assignment</li>
                <li>Status changes from Pending → Approved</li>
                <li>Owner optionally marks as Demo-Paid (simulation only)</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

