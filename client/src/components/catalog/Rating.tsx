import { Star } from 'lucide-react';

/** "4.5 ★ (12)" or "No ratings yet" — ratings arrive with add-purchase-orders. */
export default function Rating({ average, count }: { average: number; count: number }) {
  if (count === 0) return <span className="text-slate-600">No ratings yet</span>;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <Star className="h-[1em] w-[1em] fill-accent text-accent" aria-hidden="true" />
      <span className="font-medium text-slate-900 tabular-nums">{average.toFixed(1)}</span>
      <span className="text-slate-600">({count})</span>
    </span>
  );
}
