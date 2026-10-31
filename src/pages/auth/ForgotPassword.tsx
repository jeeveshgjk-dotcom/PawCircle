import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPassword() {
  const { resetPassword, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-10 bg-sage-500 rounded-xl flex items-center justify-center shadow-sm">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-sage-800">PawCircle</span>
        </Link>
        <h2 className="text-center text-2xl font-bold text-sage-900">
          Reset your password
        </h2>
        <p className="mt-1 text-center text-sm text-sage-600">
          Enter your email address and we will send you a reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-sage-100 rounded-2xl sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-sage-900 text-lg">Check Your Email</h3>
              <p className="text-sm text-sage-600 leading-relaxed">
                If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
              </p>
              <div className="pt-2">
                <Link to="/login" className="btn-primary block w-full text-center text-sm py-2.5">
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {(localError || error) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{localError || error}</span>
                </div>
              )}

              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-sage-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending link...
                  </>
                ) : (
                  <>
                    Send Reset Link <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-sage-500 hover:text-sage-700 inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

