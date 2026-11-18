'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api/client';
import { createClient } from '@/lib/supabase/client';

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  tenantId: string | null;
};

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  // Set when a Supabase session exists but the profile couldn't be loaded.
  // Callers must not treat this as "signed out", or /auth and /dashboard
  // redirect to each other forever.
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let hasSession = false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      hasSession = Boolean(session);
      if (!session) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      const profile = await apiGet<User>('/api/users');
      setUser(profile);
      setIsAuthenticated(true);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(hasSession);
      if (hasSession) {
        setError(err instanceof Error ? err.message : 'Could not load your account.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    return () => subscription.unsubscribe();
  }, [fetchUser, supabase]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await fetchUser();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  return { isLoading, isAuthenticated, user, error, refetch: fetchUser, signIn, signOut };
}
