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
  const supabase = createClient();

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      const profile = await apiGet<User>('/api/users');
      setUser(profile);
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
      setUser(null);
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

  return { isLoading, isAuthenticated, user, signIn, signOut };
}
