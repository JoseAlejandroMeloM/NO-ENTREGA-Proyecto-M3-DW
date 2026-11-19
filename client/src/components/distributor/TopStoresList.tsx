import type { DistributorInsights } from '../../types/insights';
import { formatCOP } from '../../utils/money';

/** Top 5 stores by revenue among the delivered orders. */
export default function TopStoresList({ stores }: { stores?: DistributorInsights['topStores'] }) {
  return (
    <div className="card">
      <h3 className="border-b border-slate-100 px-4 py-3 font-semibold">Top stores</h3>
      {stores && stores.length === 0 && <p className="px-4 py-6 text-sm text-slate-600">No deliveries in this range.</p>}
      <ol className="divide-y divide-slate-100">
        {stores?.map((s, n) => (
          <li key={s.store} className="flex items-baseline justify-between gap-2 px-4 py-2.5 text-sm">
            <span className="truncate">
              <span className="mr-2 inline-block w-5 text-slate-500 tabular-nums">{n + 1}</span>
              {s.name}
            </span>
            <span className="shrink-0 tabular-nums">
              <span className="font-medium">{formatCOP(s.revenue)}</span>
              <span className="ml-2 text-slate-600">{s.orders} {s.orders === 1 ? 'order' : 'orders'}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
