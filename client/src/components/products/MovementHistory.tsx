import { REASON_LABEL, type MovementPage, type StockMovement } from '../../types/product';
import { timeAgo } from '../../utils/time';
import LoadingState from '../LoadingState';

const TYPE_LABEL: Record<StockMovement['type'], string> = {
  adjustment: 'Adjustment',
  sale: 'Sale',
  order_received: 'Order received',
  void: 'Sale voided',
};

/** Movement history on S07 (US-11 AC2): every stock change with who, why and when. */
export default function MovementHistory({ data, loading }: { data: MovementPage | null; loading: boolean }) {
  return (
    <section className="card">
      <h2 className="border-b border-slate-100 px-5 py-3 font-semibold">Stock history</h2>
      {!data && loading && <LoadingState />}
      {data && data.data.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">No stock changes yet.</p>}
      <ul className="divide-y divide-slate-100">
        {data?.data.map((m) => (
          <li key={m.id} className="flex items-start justify-between gap-3 px-5 py-3 text-sm">
            <div>
              <p className="font-medium">
                {TYPE_LABEL[m.type]}
                {m.reason && <span className="font-normal text-slate-500"> · {REASON_LABEL[m.reason]}</span>}
              </p>
              {m.note && <p className="text-slate-600">{m.note}</p>}
              <p className="text-xs text-slate-600">
                {m.user?.name ?? 'Unknown user'} · <time dateTime={m.createdAt} title={new Date(m.createdAt).toLocaleString()}>{timeAgo(m.createdAt)}</time>
              </p>
            </div>
            <div className="text-right tabular-nums">
              <p className={`font-semibold ${m.quantity > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
              </p>
              <p className="text-xs text-slate-600">stock {m.stockAfter}</p>
            </div>
          </li>
        ))}
      </ul>
      {data && data.total > data.data.length && (
        <p className="border-t border-slate-100 px-5 py-2 text-xs text-slate-500">
          Showing the latest {data.data.length} of {data.total} changes.
        </p>
      )}
    </section>
  );
}
