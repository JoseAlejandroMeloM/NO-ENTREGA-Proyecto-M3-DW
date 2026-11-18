import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { NOTIFICATIONS_CHANGED } from '../api/notifications';
import type { RestockResponse } from '../types/insights';
import { useAuth } from './useAuth';
import { usePolling } from './usePolling';

const POLL_MS = 60_000;

/**
 * Number of products to restock for the sidebar badge (add-restock-alerts). Only owner and inventory
 * clerk can read /insights/restock, so other roles never request it. Refreshes every minute, when
 * notifications change and on every page change (e.g. right after a sale or a received order).
 */
export function useRestockCount(): number {
  const role = useAuth().session?.user.role;
  const allowed = role === 'store_owner' || role === 'store_inventory';
  const { data, reload } = usePolling<RestockResponse>(allowed ? '/insights/restock' : null, POLL_MS, NOTIFICATIONS_CHANGED);

  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false; // the first load already happened on mount
      return;
    }
    reload();
  }, [pathname, reload]);

  return data?.count ?? 0;
}
