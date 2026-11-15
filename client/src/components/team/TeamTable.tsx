import type { User } from '../../types/auth';
import { ROLE_LABEL } from '../../layouts/nav';
import Badge from '../Badge';
import Button from '../Button';

interface Props {
  users: User[];
  currentUserId: string;
  busyId: string | null;
  onToggle: (user: User) => void;
}

/** Team list with activate / deactivate (US-04 AC2). Becomes stacked cards on small screens. */
export default function TeamTable({ users, currentUserId, busyId, onToggle }: Props) {
  return (
    <ul className="divide-y divide-slate-200 card">
      {users.map((u) => (
        <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-medium">
              {u.name} {u.id === currentUserId && <span className="text-xs text-slate-500">(you)</span>}
            </p>
            <p className="text-sm text-slate-500">{u.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="info">{ROLE_LABEL[u.role]}</Badge>
            <Badge tone={u.active ? 'success' : 'neutral'}>{u.active ? 'Active' : 'Inactive'}</Badge>
            {u.id !== currentUserId && (
              <Button variant={u.active ? 'secondary' : 'primary'} loading={busyId === u.id} onClick={() => onToggle(u)}>
                {u.active ? 'Deactivate' : 'Activate'}
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
