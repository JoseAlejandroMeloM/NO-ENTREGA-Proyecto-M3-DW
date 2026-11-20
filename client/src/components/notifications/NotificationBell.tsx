import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { markAllRead, NOTIFICATIONS_CHANGED } from '../../api/notifications';
import { usePolling } from '../../hooks/usePolling';
import type { NotificationPage } from '../../types/notification';
import NotificationItem from './NotificationItem';

const POLL_MS = 30_000; // spec: the count refreshes at least every 30 s

/** Bell in the top bar: unread count + latest 5 (US-41). */
export default function NotificationBell() {
  const { data } = usePolling<NotificationPage>('/notifications?limit=5', POLL_MS, NOTIFICATIONS_CHANGED);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span key={unread} className="pop absolute top-0 right-0 min-w-5 rounded-full bg-accent px-1 text-center text-xs leading-5 font-semibold text-black ring-2 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-overlay transition-[opacity,scale] starting:scale-95 starting:opacity-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={() => markAllRead()} className="text-xs font-medium text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {data && data.data.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">You're all caught up.</p>
          ) : (
            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {data?.data.map((n) => <NotificationItem key={n.id} notification={n} onOpen={() => setOpen(false)} />)}
            </div>
          )}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-2 text-center text-sm font-medium text-primary hover:bg-slate-50"
          >
            See all
          </Link>
        </div>
      )}
    </div>
  );
}
