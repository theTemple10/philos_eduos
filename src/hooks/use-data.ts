'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type QueryResult<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useQuery<T>(fetcher: () => Promise<T>): QueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const doFetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    mountedRef.current = true;
    doFetch();
    return () => { mountedRef.current = false; };
  }, [doFetch]);

  return { data, isLoading, error, refetch: doFetch };
}
