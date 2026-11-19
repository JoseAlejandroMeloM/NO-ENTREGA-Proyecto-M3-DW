import type { DistributorInsights } from '../../types/insights';
import { UNIT_LABEL } from '../../types/product';
import { formatCOP } from '../../utils/money';

/** Top 10 items by quantity among the delivered orders. */
export default function TopItemsList({ items }: { items?: DistributorInsights['topItems'] }) {
  return (
    <div className="card">
      <h3 className="border-b border-slate-100 px-4 py-3 font-semibold">Top items</h3>
      {items && items.length === 0 && <p className="px-4 py-6 text-sm text-slate-600">No deliveries in this range.</p>}
      <ol className="divide-y divide-slate-100">
        {items?.map((i, n) => (
          <li key={i.catalogItem} className="flex items-baseline justify-between gap-2 px-4 py-2.5 text-sm">
            <span className="truncate">
              <span className="mr-2 inline-block w-5 text-slate-500 tabular-nums">{n + 1}</span>
              {i.name}
            </span>
            <span className="shrink-0 tabular-nums">
              <span className="font-medium">{i.quantity} {i.unit === 'unit' ? 'u' : UNIT_LABEL[i.unit]}</span>
              <span className="ml-2 text-slate-600">{formatCOP(i.revenue)}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
