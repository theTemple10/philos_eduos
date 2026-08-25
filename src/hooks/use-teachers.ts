'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api/client';

export function useTeachers() {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGet<Record<string, any>[]>('/api/teachers');
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetcher(); }, [fetcher]);

  return { data, isLoading, error, refetch: fetcher };
}

export function useTeacherByUser() {
  const [data, setData] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGet<Record<string, any>[]>('/api/teachers', { byUser: 'true' });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetcher(); }, [fetcher]);

  return { data, isLoading, error, refetch: fetcher };
}
