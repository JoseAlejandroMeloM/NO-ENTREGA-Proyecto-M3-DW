import { Link } from 'react-router-dom';
import { NOTIFICATIONS_CHANGED } from '../../api/notifications';
import { usePolling } from '../../hooks/usePolling';

/** Unread order messages (S05, S19): unread `message` notifications, refreshed with the bell. */
export default function UnreadMessagesCard() {
  const { data } = usePolling<{ total: number }>('/notifications?unread=true&type=message&limit=1', 30000, NOTIFICATIONS_CHANGED);
  const count = data?.total;
  return (
    <Link to="/notifications" className="block w-full max-w-xs self-start rounded-xl border border-slate-200 bg-white p-4 hover:border-primary">
      <p className="text-sm text-slate-600">Unread messages</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${count ? 'text-primary' : 'text-slate-900'}`}>{count ?? '–'}</p>
      <p className="mt-1 text-xs text-primary">Open →</p>
    </Link>
  );
}
