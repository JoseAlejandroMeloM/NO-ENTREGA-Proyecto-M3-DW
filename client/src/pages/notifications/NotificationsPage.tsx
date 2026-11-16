import { useState } from 'react';
import { markAllRead, NOTIFICATIONS_CHANGED } from '../../api/notifications';
import Button from '../../components/Button';
import FormAlert from '../../components/FormAlert';
import NotificationItem from '../../components/notifications/NotificationItem';
import { usePolling } from '../../hooks/usePolling';
import type { NotificationPage } from '../../types/notification';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Tabs from '../../components/Tabs';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';

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
      <PageHeader
        title="Notifications"
        subtitle={data ? `${data.unreadCount} unread` : 'Low stock, order updates and messages for you.'}
        actions={
          <Button variant="secondary" onClick={readAll} loading={busy} disabled={!data?.unreadCount}>
            Mark all read
          </Button>
        }
      />

      <Tabs
        label="Filter notifications"
        tabs={[
          { label: 'All', value: false },
          { label: 'Unread', value: true },
        ]}
        value={unreadOnly}
        onChange={filter}
      />

      <FormAlert message={error} />

      <div className="overflow-hidden card">
        {!data && loading && <LoadingState />}
        {data && data.data.length === 0 && (
          <EmptyState title={unreadOnly ? 'No unread notifications.' : 'No notifications yet.'} />
        )}
        <div className="divide-y divide-slate-100">
          {data?.data.map((n) => <NotificationItem key={n.id} notification={n} />)}
        </div>
      </div>

      <Pagination page={page} pages={pages} onChange={setPage} />
    </section>
  );
}
