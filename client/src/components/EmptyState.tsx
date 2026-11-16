import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  icon?: LucideIcon;
  /** Optional next step: a sentence, a link or a button. */
  children?: ReactNode;
}

/** What a list shows when it has nothing to show. Say what is missing and, when possible, what to do next. */
export default function EmptyState({ title, icon: Icon = Inbox, children }: Props) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-700">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-600">{children}</div>}
    </div>
  );
}
