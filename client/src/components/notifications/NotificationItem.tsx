import { useNavigate } from 'react-router-dom';
import { markRead } from '../../api/notifications';
import type { AppNotification } from '../../types/notification';
import { timeAgo } from '../../utils/time';

interface Props {
  notification: AppNotification;
  onOpen?: () => void;
}

/** One row of the bell dropdown and of S25. Opening it marks it read and goes to its screen. */
export default function NotificationItem({ notification: n, onOpen }: Props) {
  const navigate = useNavigate();
  const open = async () => {
    onOpen?.();
    if (!n.read) await markRead(n.id).catch(() => undefined); // navigation still works if this fails
    if (n.link) navigate(n.link);
  };

  return (
    <button
      type="button"
      onClick={open}
      className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 ${n.read ? '' : 'bg-primary-soft/40'}`}
    >
      <span
        aria-hidden
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-accent'}`}
      />
      <span className="min-w-0 flex-1">
        <span className={`block text-sm ${n.read ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{n.title}</span>
        {n.body && <span className="block truncate text-xs text-slate-500">{n.body}</span>}
        <span className="block text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
      </span>
      {!n.read && <span className="sr-only">Unread</span>}
    </button>
  );
}
