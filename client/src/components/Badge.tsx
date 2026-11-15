import type { ReactNode } from 'react';

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

// Tinted fill + a hairline ring of the same hue keeps badges crisp on white and on tinted rows.
const TONES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  info: 'bg-blue-50 text-blue-800 ring-blue-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  success: 'bg-green-50 text-green-800 ring-green-600/20',
  danger: 'bg-red-50 text-red-800 ring-red-600/20',
};

/** Small status label. The tone carries meaning (see "Status colors" in docs/design-brief.md). */
export default function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${TONES[tone]}`}>
      {children}
    </span>
  );
}
