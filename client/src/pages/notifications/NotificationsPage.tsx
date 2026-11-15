import { useState } from 'react';
import { markAllRead, NOTIFICATIONS_CHANGED } from '../../api/notifications';
import Button from '../../components/Button';
import FormAlert from '../../components/FormAlert';
import NotificationItem from '../../components/notifications/NotificationItem';
import { usePolling } from '../../hooks/usePolling';
import type { NotificationPage } from '../../types/notification';

const LIMIT = 20;

/** S25 Notifications (US-41): full inbox, unread filter, mark all read. */
export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const path = `/notifications?page=${page}&limit=${LIMIT}${unreadOnly ? '&unread=true' : ''}`;
  const { data, error, loading } = usePolling<NotificationPage>(path, 30_000, NOTIFICATIONS_CHANGED);
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  const readAll = async () => {
    setBusy(true);
    await markAllRead().catch(() => undefined);
    setBusy(false);
  };
  const filter = (value: boolean) => {
    setUnreadOnly(value);
    setPage(1);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-slate-600">
            {data ? `${data.unreadCount} unread` : 'Low stock, order updates and messages for you.'}
          </p>
        </div>
        <Button variant="secondary" onClick={readAll} loading={busy} disabled={!data?.unreadCount}>
          Mark all read
        </Button>
      </div>

      <div className="flex gap-2" role="tablist">
        {[
          { label: 'All', value: false },
          { label: 'Unread', value: true },
        ].map((t) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={unreadOnly === t.value}
            onClick={() => filter(t.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              unreadOnly === t.value ? 'bg-primary-soft text-primary-dark' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <FormAlert message={error} />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {!data && loading && <p className="px-4 py-8 text-center text-sm text-slate-500">Loading…</p>}
        {data && data.data.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            {unreadOnly ? 'No unread notifications.' : 'No notifications yet.'}
          </p>
        )}
        <div className="divide-y divide-slate-100">
          {data?.data.map((n) => <NotificationItem key={n.id} notification={n} />)}
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
            Previous
          </Button>
          <span className="text-slate-600">
            Page {page} of {pages}
          </span>
          <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page >= pages}>
            Next
          </Button>
        </div>
      )}
    </section>
  );
}
