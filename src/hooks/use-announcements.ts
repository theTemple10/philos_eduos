'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api/client';

export function useAnnouncements() {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGet<Record<string, any>[]>('/api/announcements');
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
