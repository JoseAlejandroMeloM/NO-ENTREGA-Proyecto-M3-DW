/** "4.5 ★ (12)" or "No ratings yet" — ratings arrive with add-purchase-orders. */
export default function Rating({ average, count }: { average: number; count: number }) {
  if (count === 0) return <span className="text-slate-500">No ratings yet</span>;
  return (
    <span>
      <span className="font-medium text-slate-900">{average.toFixed(1)}</span>
      <span className="text-accent" aria-hidden="true"> ★</span>
      <span className="text-slate-500"> ({count})</span>
    </span>
  );
}
