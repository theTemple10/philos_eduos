'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api/client';

export function useStudents() {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGet<Record<string, any>[]>('/api/students');
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

export function useStudentsByClass(classId: string | undefined) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    if (!classId) { setData([]); setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGet<Record<string, any>[]>('/api/students', { classId });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => { fetcher(); }, [fetcher]);

  return { data, isLoading, error, refetch: fetcher };
}

export function useStudentByUser() {
  const [data, setData] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGet<Record<string, any>[]>('/api/students', { byUser: 'true' });
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
