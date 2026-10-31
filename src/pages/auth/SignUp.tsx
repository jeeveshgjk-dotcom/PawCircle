import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PawPrint, Lock, Mail, User, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/database';

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, error, clearError } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('owner');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await signUp(email.trim(), password, displayName.trim(), role);
      if (res.needEmailConfirmation) {
        setConfirmationNeeded(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('rate limit')) {
        setLocalError(
          'Email rate limit reached on Supabase free tier (max 3-4 emails/hour). To test without limits, turn off "Confirm email" in your Supabase Dashboard under Authentication -> Providers -> Email.'
        );
      } else {
        setLocalError(msg || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (confirmationNeeded) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
          <div className="bg-white py-8 px-6 shadow-card border border-emerald-950/5 rounded-3xl sm:px-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Check Your Email</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium">
              We sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to activate your PawCircle account.
            </p>
            <div className="space-y-3">
              <Link to="/login" className="btn-primary block w-full text-center text-sm py-3 shadow-md shadow-emerald-500/25">
                Go to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-3 group">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">PawCircle</span>
        </Link>
        <h2 className="text-center text-2xl font-black text-slate-900 tracking-tight">
          Create your account
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700 underline">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-white py-8 px-6 shadow-card border border-emerald-950/5 rounded-3xl sm:px-10">
          {(localError || error) && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Sharma"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Password (min 6 characters)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Primary Role</label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    role === 'owner'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400/30 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="text-sm font-bold">🏠 Pet Owner</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Manage pets & care</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('caretaker')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    role === 'caretaker'
                      ? 'border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-400/30 shadow-xs'
                      : 'border-slate-200 hover:bg-orange-50/40 text-slate-600'
                  }`}
                >
                  <div className="text-sm font-bold">🐾 Caretaker</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Offer care services</div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4 shadow-md shadow-emerald-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

