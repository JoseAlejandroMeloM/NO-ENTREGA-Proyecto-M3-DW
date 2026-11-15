import type { PurchaseOrder } from '../../types/order';
import { STATUS_LABEL } from '../../types/order';

const FLOW = ['pending', 'accepted', 'shipped', 'delivered'] as const;
const when = (iso: string) => new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

/** Status timeline (US-34): every step done so far with who and when, then the steps still ahead. */
export default function OrderTimeline({ order }: { order: PurchaseOrder }) {
  const done = order.statusHistory;
  const finished = order.status === 'rejected' || order.status === 'cancelled';
  const ahead = finished ? [] : FLOW.filter((s) => !done.some((h) => h.status === s));
  return (
    <ol className="space-y-4">
      {done.map((h, i) => (
        <li key={`${h.status}-${i}`} className="flex gap-3">
          <span
            aria-hidden="true"
            className={`mt-1 h-3 w-3 shrink-0 rounded-full ${h.status === 'rejected' || h.status === 'cancelled' ? 'bg-red-500' : 'bg-primary'}`}
          />
          <div className="text-sm">
            <p className="font-medium text-slate-900">{STATUS_LABEL[h.status]}</p>
            <p className="text-xs text-slate-500">
              {when(h.at)} · {h.by.name}
            </p>
            {h.note && <p className="mt-1 text-slate-700">“{h.note}”</p>}
          </div>
        </li>
      ))}
      {ahead.map((s) => (
        <li key={s} className="flex gap-3">
          <span aria-hidden="true" className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-slate-300" />
          <p className="text-sm text-slate-400">{STATUS_LABEL[s]}</p>
        </li>
      ))}
    </ol>
  );
}
