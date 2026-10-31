import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabasePublishableKey) &&
    !supabaseUrl.includes('your-project') &&
    !supabasePublishableKey.includes('your-publishable-key')
  );
};

if (!isSupabaseConfigured()) {
  console.warn(
    '⚠️ Supabase is not properly configured. Please check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

