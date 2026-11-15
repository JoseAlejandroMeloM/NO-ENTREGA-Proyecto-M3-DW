import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';

interface Result<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/** Loads `path` on mount (and when it changes). `reload()` fetches again after a mutation. */
export function useApi<T>(path: string | null) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result<T>>({ key: '', data: null, error: null });
  const key = `${path}#${version}`;

  useEffect(() => {
    if (!path) return;
    let cancelled = false; // ignore responses that arrive after unmount or a newer request
    api<T>(path)
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((err) => {
        if (!cancelled) setResult((r) => ({ key, data: r.data, error: err instanceof ApiError ? err.message : 'Could not load data' }));
      });
    return () => {
      cancelled = true;
    };
  }, [path, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  // Loading = the latest request has not answered yet; previous data stays visible meanwhile.
  return { data: result.data, error: result.error, loading: path !== null && result.key !== key, reload };
}
