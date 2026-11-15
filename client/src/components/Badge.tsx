import type { ReactNode } from 'react';

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const TONES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-amber-100 text-amber-800',
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-100 text-red-800',
};

/** Figma "Badge" component. */
export default function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}
