import { Check, X } from 'lucide-react';
import type { PurchaseOrder } from '../../types/order';
import { STATUS_LABEL } from '../../types/order';

const FLOW = ['pending', 'accepted', 'shipped', 'delivered'] as const;
const when = (iso: string) => new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

// The vertical line that joins a step to the next one (not drawn after the last step).
const RAIL = 'relative flex gap-3 pb-5 last:pb-0 before:absolute before:top-6 before:bottom-0 before:left-[0.6875rem] before:w-0.5 last:before:hidden';

/** Status timeline (US-34): every step done so far with who and when, then the steps still ahead. */
export default function OrderTimeline({ order }: { order: PurchaseOrder }) {
  const done = order.statusHistory;
  const finished = order.status === 'rejected' || order.status === 'cancelled';
  const ahead = finished ? [] : FLOW.filter((s) => !done.some((h) => h.status === s));
  return (
    <ol>
      {done.map((h, i) => {
        const stopped = h.status === 'rejected' || h.status === 'cancelled';
        const latest = i === done.length - 1;
        return (
          <li key={`${h.status}-${i}`} className={`${RAIL} ${latest ? 'before:bg-slate-200' : 'before:bg-primary'}`}>
            <span
              aria-hidden="true"
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${stopped ? 'bg-red-600' : 'bg-primary'} ${
                latest ? (stopped ? 'ring-4 ring-red-100' : 'ring-4 ring-primary-soft') : ''
              }`}
            >
              {stopped ? <X className="h-3.5 w-3.5" strokeWidth={3} /> : <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <div className="min-w-0 text-sm">
              <p className="font-medium text-slate-900">{STATUS_LABEL[h.status]}</p>
              <p className="text-xs text-slate-600">
                {when(h.at)} · {h.by.name}
              </p>
              {h.note && <p className="mt-1.5 rounded-lg bg-slate-100 px-3 py-2 text-slate-700">{h.note}</p>}
            </div>
          </li>
        );
      })}
      {ahead.map((s) => (
        <li key={s} className={`${RAIL} before:bg-slate-200`}>
          <span aria-hidden="true" className="h-6 w-6 shrink-0 rounded-full border-2 border-slate-300 bg-white" />
          <p className="pt-0.5 text-sm text-slate-600">{STATUS_LABEL[s]}</p>
        </li>
      ))}
    </ol>
  );
}
