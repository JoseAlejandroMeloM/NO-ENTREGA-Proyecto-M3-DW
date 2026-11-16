import StatCard from '../StatCard';
import { NOTIFICATIONS_CHANGED } from '../../api/notifications';
import { usePolling } from '../../hooks/usePolling';

/** Unread order messages (S05, S19): unread `message` notifications, refreshed with the bell. */
export default function UnreadMessagesCard() {
  const { data } = usePolling<{ total: number }>('/notifications?unread=true&type=message&limit=1', 30000, NOTIFICATIONS_CHANGED);
  const count = data?.total;
  return (
    <StatCard
      to="/notifications"
      label="Unread messages"
      value={count ?? '–'}
      tone={count ? 'primary' : 'default'}
      linkLabel="Open"
      className="w-full max-w-xs self-start"
    />
  );
}
