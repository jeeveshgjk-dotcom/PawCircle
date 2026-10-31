import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { DbProfile, DbHousehold, UserRole } from '../types/database';
import { saveProfileToRegistry } from '../services/liveDataService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: DbProfile | null;
  household: DbHousehold | null;
  userHouseholds: DbHousehold[];
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  migrationNeeded: boolean;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<{ needEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (updates: Partial<DbProfile>) => Promise<void>;
  updateHouseholdName: (name: string) => Promise<void>;
  switchHousehold: (householdId: string) => void;
  refreshProfile: () => Promise<void>;
  refreshHousehold: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [household, setHousehold] = useState<DbHousehold | null>(null);
  const [userHouseholds, setUserHouseholds] = useState<DbHousehold[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [migrationNeeded, setMigrationNeeded] = useState<boolean>(false);

  const isConfigured = isSupabaseConfigured();

  const clearError = () => setError(null);

  // Load or create profile
  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userRole?: UserRole, displayName?: string) => {
    try {
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) {
        if (profileErr.code === 'PGRST205' || profileErr.message.includes('profiles')) {
          setMigrationNeeded(true);
          return null;
        }
        console.warn('Error fetching profile:', profileErr.message);
        return null;
      }

      if (data) {
        const prof = data as DbProfile;
        setProfile(prof);
        setMigrationNeeded(false);
        saveProfileToRegistry({
          id: prof.id,
          email: prof.email,
          display_name: prof.display_name,
          role: prof.role,
          photo_url: prof.photo_url,
          bio: prof.bio,
        });
        return prof;
      }

      // Profile doesn't exist yet, attempt to create it
      const newProfile: Partial<DbProfile> = {
        id: userId,
        email: userEmail || null,
        display_name: displayName || userEmail?.split('@')[0] || 'User',
        role: userRole || 'owner',
        skills: [],
      };

      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (!createErr && created) {
        const prof = created as DbProfile;
        setProfile(prof);
        saveProfileToRegistry({
          id: prof.id,
          email: prof.email,
          display_name: prof.display_name,
          role: prof.role,
          photo_url: prof.photo_url,
          bio: prof.bio,
        });
        return prof;
      }

      return null;
    } catch (err: any) {
      console.error('fetchProfile error:', err);
      return null;
    }
  }, []);

  // Fetch all households this user is an owner or member of
  const fetchHousehold = useCallback(async (userId: string, userName?: string) => {
    try {
      const allHouseholds: DbHousehold[] = [];
      const seenIds = new Set<string>();

      // 1. Check Supabase household_members
      try {
        const { data: memberRows, error: memberErr } = await supabase
          .from('household_members')
          .select('household_id, role, households(*)')
          .eq('user_id', userId);

        if (memberErr && memberErr.code === 'PGRST205') {
          setMigrationNeeded(true);
        } else if (memberRows && memberRows.length > 0) {
          memberRows.forEach((r: any) => {
            if (r.households && !seenIds.has(r.households.id)) {
              seenIds.add(r.households.id);
              allHouseholds.push(r.households as DbHousehold);
            }
          });
        }
      } catch {
        // fallback
      }

      // 2. Check shared local storage household_members
      try {
        const rawMembers = localStorage.getItem('pawcircle_live_household_members');
        const localMembers = rawMembers ? JSON.parse(rawMembers) : [];
        const myMemberships = localMembers.filter((m: any) => m.user_id === userId);

        const rawHouseholds = localStorage.getItem('pawcircle_live_households');
        const localHouseholds: DbHousehold[] = rawHouseholds ? JSON.parse(rawHouseholds) : [];

        for (const m of myMemberships) {
          if (!seenIds.has(m.household_id)) {
            const foundH = localHouseholds.find(h => h.id === m.household_id);
            if (foundH) {
              seenIds.add(foundH.id);
              allHouseholds.push(foundH);
            }
          }
        }
      } catch {
        // ignore
      }

      // 3. If user has no household at all, create one
      if (allHouseholds.length === 0) {
        const newHouseholdName = userName ? `${userName}'s Family` : 'My Household';
        const now = new Date().toISOString();
        const fallbackH: DbHousehold = {
          id: crypto.randomUUID(),
          name: newHouseholdName,
          created_by: userId,
          created_at: now,
          updated_at: now,
        };

        try {
          const { data: newH } = await supabase
            .from('households')
            .insert({ name: newHouseholdName, created_by: userId })
            .select()
            .single();

          if (newH) {
            await supabase.from('household_members').insert({
              household_id: newH.id,
              user_id: userId,
              role: 'owner',
            });
            allHouseholds.push(newH as DbHousehold);
          }
        } catch {
          allHouseholds.push(fallbackH);
        }

        if (allHouseholds.length === 0) {
          allHouseholds.push(fallbackH);
        }

        // Cache household in shared storage
        try {
          const rawH = localStorage.getItem('pawcircle_live_households');
          const hList: DbHousehold[] = rawH ? JSON.parse(rawH) : [];
          allHouseholds.forEach(h => {
            if (!hList.some(item => item.id === h.id)) hList.push(h);
          });
          localStorage.setItem('pawcircle_live_households', JSON.stringify(hList));
        } catch {
          // ignore
        }
      }

      // Save households to shared local cache for instant lookup
      try {
        const rawH = localStorage.getItem('pawcircle_live_households');
        const hList: DbHousehold[] = rawH ? JSON.parse(rawH) : [];
        allHouseholds.forEach(h => {
          if (!hList.some(item => item.id === h.id)) hList.push(h);
        });
        localStorage.setItem('pawcircle_live_households', JSON.stringify(hList));
      } catch {
        // ignore
      }

      setUserHouseholds(allHouseholds);

      // Pick active household
      const savedActiveId = localStorage.getItem('pawcircle_active_household_id');
      const active = allHouseholds.find(h => h.id === savedActiveId) || allHouseholds[0];
      setHousehold(active);
    } catch (err: any) {
      console.error('fetchHousehold error:', err);
    }
  }, []);

  const switchHousehold = useCallback((householdId: string) => {
    const target = userHouseholds.find(h => h.id === householdId);
    if (target) {
      setHousehold(target);
      localStorage.setItem('pawcircle_active_household_id', target.id);
    }
  }, [userHouseholds]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.email || undefined);
    }
  }, [user, fetchProfile]);

  const refreshHousehold = useCallback(async () => {
    if (user) {
      await fetchHousehold(user.id, profile?.display_name);
    }
  }, [user, profile, fetchHousehold]);

  // Initial session restoration & state listener
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function initSession() {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            const userMeta = initialSession.user.user_metadata || {};
            await fetchProfile(
              initialSession.user.id,
              initialSession.user.email,
              userMeta.role,
              userMeta.display_name
            );
            await fetchHousehold(initialSession.user.id, userMeta.display_name);
          }
        }
      } catch (err: any) {
        console.error('Session initialization error:', err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' && newSession?.user) {
        const userMeta = newSession.user.user_metadata || {};
        await fetchProfile(
          newSession.user.id,
          newSession.user.email,
          userMeta.role,
          userMeta.display_name
        );
        await fetchHousehold(newSession.user.id, userMeta.display_name);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setProfile(null);
        setHousehold(null);
        setUserHouseholds([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured, fetchProfile, fetchHousehold]);

  const signUp = async (email: string, password: string, displayName: string, role: UserRole) => {
    setError(null);
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpErr) throw signUpErr;

      const needEmailConfirmation = !data.session;
      return { needEmailConfirmation };
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) throw signInErr;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      setUser(null);
      setSession(null);
      setProfile(null);
      setHousehold(null);
      setUserHouseholds([]);

      await supabase.auth.signOut();
    } catch (err: any) {
      setError(err.message || 'Signout failed');
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetErr) throw resetErr;
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
      throw err;
    }
  };

  const updatePassword = async (password: string) => {
    setError(null);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password,
      });

      if (updateErr) throw updateErr;
    } catch (err: any) {
      setError(err.message || 'Password update failed');
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<DbProfile>) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error: updateErr } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    if (data) {
      const prof = data as DbProfile;
      setProfile(prof);
      saveProfileToRegistry({
        id: prof.id,
        email: prof.email,
        display_name: prof.display_name,
        role: prof.role,
        photo_url: prof.photo_url,
        bio: prof.bio,
      });
    }
  };

  const updateHouseholdName = async (name: string) => {
    if (!household || !user) throw new Error('No household active');
    const { data, error: updateErr } = await supabase
      .from('households')
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', household.id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    if (data) {
      const updatedH = data as DbHousehold;
      setHousehold(updatedH);
      setUserHouseholds(prev => prev.map(h => h.id === updatedH.id ? updatedH : h));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        household,
        userHouseholds,
        loading,
        error,
        isConfigured,
        migrationNeeded,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        updateHouseholdName,
        switchHousehold,
        refreshProfile,
        refreshHousehold,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
