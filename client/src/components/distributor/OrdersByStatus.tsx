import { ORDER_STATUSES, type OrderStatus } from '../../types/order';
import OrderStatusBadge from '../orders/OrderStatusBadge';

/** Orders created in the range, one row per status. Styled like a StatCard so it sits in the same grid. */
export default function OrdersByStatus({ counts }: { counts?: Record<OrderStatus, number> }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-600">Orders by status</p>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {ORDER_STATUSES.map((s) => (
          <li key={s} className="flex items-center justify-between gap-2 text-sm">
            <OrderStatusBadge status={s} />
            <span className="font-medium tabular-nums">{counts ? counts[s] : '–'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
