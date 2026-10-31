import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      try {
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        // If URL contains type=recovery, go to reset-password
        const hash = window.location.hash;
        if (hash.includes('type=recovery')) {
          navigate('/auth/reset-password', { replace: true });
          return;
        }

        // Otherwise redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication callback failed.');
      }
    }

    handleAuth();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-red-200 max-w-md w-full text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h2 className="font-bold text-sage-800">Authentication Failed</h2>
          <p className="text-xs text-red-600">{error}</p>
          <button onClick={() => navigate('/login')} className="btn-primary text-xs py-2">
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 text-sage-500 animate-spin mb-3" />
      <p className="text-sage-600 text-sm font-medium">Verifying your account, please wait...</p>
    </div>
  );
}

