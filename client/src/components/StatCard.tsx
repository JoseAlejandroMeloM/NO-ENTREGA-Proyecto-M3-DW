import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Tone = 'default' | 'primary' | 'warning' | 'info';

const TONES: Record<Tone, string> = {
  default: 'text-slate-900',
  primary: 'text-primary',
  warning: 'text-amber-700',
  info: 'text-blue-700',
};

interface Props {
  label: string;
  /** The big number (or "–" while it loads). */
  value: ReactNode;
  tone?: Tone;
  /** Muted line under the number. */
  hint?: ReactNode;
  /** Makes the whole card a link. */
  to?: string;
  /** Short call to action shown when `to` is set, e.g. "View list". */
  linkLabel?: string;
  className?: string;
  children?: ReactNode;
}

/** Dashboard card: label, one big number, optional hint and link. */
export default function StatCard({ label, value, tone = 'default', hint, to, linkLabel, className = '', children }: Props) {
  const body = (
    <>
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${TONES[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
      {children}
      {to && linkLabel && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </p>
      )}
    </>
  );
  if (!to) return <div className={`card p-4 ${className}`}>{body}</div>;
  return (
    <Link to={to} className={`group card block p-4 transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-raised ${className}`}>
      {body}
    </Link>
  );
}
