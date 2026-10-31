import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PawPrint, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, error, clearError, isConfigured } = useAuth();
  const { setRole } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setLocalError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueDemo = () => {
    navigate('/demo');
  };

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
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500 font-medium">
          Or{' '}
          <Link to="/signup" className="font-bold text-emerald-600 hover:text-emerald-700 underline">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-white py-8 px-6 shadow-card border border-emerald-950/5 rounded-3xl sm:px-10">
          {!isConfigured && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 font-medium">
              ⚠️ Supabase is not fully configured in <code>.env.local</code>. You can still test in Demo Mode below.
            </div>
          )}

          {(localError || error) && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 shadow-md shadow-emerald-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium mb-2.5">Want to try without creating an account?</p>
              <button
                type="button"
                onClick={handleContinueDemo}
                className="btn-outline w-full text-xs py-2.5"
              >
                Continue in Local Demo Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

