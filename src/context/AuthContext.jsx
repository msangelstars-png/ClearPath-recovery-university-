import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
    return data;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
        if (event === 'INITIAL_SESSION') setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    currentUser: user && profile ? {
      ...profile,
      id: user.id,
      email: user.email,
      display_name: profile.display_name || user.email.split('@')[0],
      avatar_emoji: profile.avatar_emoji || '🎓',
      avatar_url: profile.avatar_url || null,
      plan: profile.plan || 'free',
      role: profile.role || 'student',
      onboarding_complete: profile.onboarding_complete || false,
      language: profile.language || 'en',
      assigned_professor: profile.assigned_professor || null,
      trial_ends_at: profile.trial_ends_at || null,
    } : null,
    async register({ name, email, password }) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      return data.user;
    },
    async login({ email, password }) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    },
    async logout() {
      await supabase.auth.signOut();
    },
    async refreshProfile() {
      if (!user) return null;
      return loadProfile(user.id);
    },
    setProfile,
  }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
