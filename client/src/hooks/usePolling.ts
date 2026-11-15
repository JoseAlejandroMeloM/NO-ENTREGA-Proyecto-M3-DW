import { useEffect } from 'react';
import { useApi } from './useApi';

/**
 * useApi that refetches every `intervalMs` while the tab is visible, and whenever
 * `refreshEvent` is dispatched on window. Polling instead of sockets: see add-notifications.
 */
export function usePolling<T>(path: string | null, intervalMs: number, refreshEvent?: string) {
  const result = useApi<T>(path);
  const { reload } = result;

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) reload();
    }, intervalMs);
    const onVisible = () => !document.hidden && reload();
    document.addEventListener('visibilitychange', onVisible);
    if (refreshEvent) window.addEventListener(refreshEvent, reload);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      if (refreshEvent) window.removeEventListener(refreshEvent, reload);
    };
  }, [intervalMs, refreshEvent, reload]);

  return result;
}
