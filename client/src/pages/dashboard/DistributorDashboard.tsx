import { Link } from 'react-router-dom';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import Rating from '../../components/catalog/Rating';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import type { Distributor } from '../../types/catalog';
import type { OrderPage } from '../../types/order';
import { formatCOP } from '../../utils/money';

function CountCard({ label, status, tone }: { label: string; status: string; tone: string }) {
  const { data } = useApi<OrderPage>(`/orders?status=${status}&limit=1`);
  return (
    <Link to={`/dist/orders?status=${status}`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-primary">
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${data?.total ? tone : 'text-slate-900'}`}>{data?.total ?? '–'}</p>
      <p className="mt-1 text-xs text-primary">View →</p>
    </Link>
  );
}

/** S19 Distributor dashboard (US-34): new and in-transit orders, rating, latest orders. Messages arrive with add-order-messaging. */
export default function DistributorDashboard() {
  const { session } = useAuth();
  const me = useApi<Distributor>('/distributors/me');
  const latest = useApi<OrderPage>('/orders?limit=5');
  if (!session) return null;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hello, {session.user.name}</h1>
        <p className="text-sm text-slate-600">{me.data?.name ?? 'Your distributor'} at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CountCard label="New orders" status="pending" tone="text-amber-600" />
        <CountCard label="Accepted, to ship" status="accepted" tone="text-blue-700" />
        <CountCard label="In transit" status="shipped" tone="text-amber-600" />
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Your rating</p>
          <p className="mt-2 text-lg">{me.data ? <Rating average={me.data.ratingAverage} count={me.data.ratingCount} /> : '–'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Latest orders</h2>
          <Link to="/dist/orders" className="text-sm text-primary hover:underline">
            All orders →
          </Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {latest.data?.data.map((o) => (
            <li key={o.id}>
              <Link to={`/dist/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50">
                <span>
                  <span className="font-medium">{o.code}</span> <span className="text-sm text-slate-600">· {o.store.name}</span>
                </span>
                <span className="flex items-center gap-3 text-sm tabular-nums">
                  {formatCOP(o.total)} <OrderStatusBadge status={o.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {latest.data && latest.data.data.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            No orders yet. Keep your <Link to="/dist/catalog" className="text-primary hover:underline">catalog</Link> up to date so stores find you.
          </p>
        )}
      </div>
    </section>
  );
}
