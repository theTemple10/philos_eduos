'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api/client';

export function useReportComments() {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGet<Record<string, any>[]>('/api/report-comments');
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

export function useReportCommentsForStudent(studentId: string | undefined) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    if (!studentId) { setData([]); setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGet<Record<string, any>[]>('/api/report-comments', { studentId });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetcher(); }, [fetcher]);

  return { data, isLoading, error, refetch: fetcher };
}

export function useApprovedReportComments(studentId: string | undefined) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    if (!studentId) { setData([]); setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGet<Record<string, any>[]>('/api/report-comments', { studentId, approved: 'true' });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetcher(); }, [fetcher]);

  return { data, isLoading, error, refetch: fetcher };
}
