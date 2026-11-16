import { Link } from 'react-router-dom';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import Rating from '../../components/catalog/Rating';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import type { Distributor } from '../../types/catalog';
import type { OrderPage } from '../../types/order';
import { formatCOP } from '../../utils/money';
import UnreadMessagesCard from '../../components/orders/UnreadMessagesCard';
import StatCard from '../../components/StatCard';

function CountCard({ label, status, tone }: { label: string; status: string; tone: 'warning' | 'info' }) {
  const { data } = useApi<OrderPage>(`/orders?status=${status}&limit=1`);
  return (
    <StatCard
      to={`/dist/orders?status=${status}`}
      label={label}
      value={data?.total ?? '–'}
      tone={data?.total ? tone : 'default'}
      linkLabel="View"
    />
  );
}

/** S19 Distributor dashboard (US-34): new and in-transit orders, rating, unread messages, latest orders. */
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <CountCard label="New orders" status="pending" tone="warning" />
        <CountCard label="Accepted, to ship" status="accepted" tone="info" />
        <CountCard label="In transit" status="shipped" tone="warning" />
        <UnreadMessagesCard />
        <StatCard label="Your rating" value={<span className="text-lg font-normal tracking-normal">{me.data ? <Rating average={me.data.ratingAverage} count={me.data.ratingCount} /> : '–'}</span>} />
      </div>

      <div className="card">
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
