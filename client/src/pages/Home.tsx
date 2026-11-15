import { Link } from 'react-router-dom';
import UnreadMessagesCard from '../components/orders/UnreadMessagesCard';
import { useApi } from '../hooks/useApi';
import { METHOD_LABEL, type DailySummary } from '../types/sale';
import { formatCOP } from '../utils/money';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABEL } from '../layouts/nav';

/** S05 Store dashboard: today's totals (owner), low stock, open orders, unread messages and quick actions. */
export default function Home() {
  const { session } = useAuth();
  if (!session) return null;
  const { user } = session;
  return (
    <>
      <h1 className="text-2xl font-semibold">Hello, {user.name}</h1>
      <p className="mt-1 text-slate-600">
        Signed in as <strong>{ROLE_LABEL[user.role]}</strong> ({user.email}).
      </p>
      {user.orgType === 'store' && (
        <div className="mt-6 flex flex-wrap gap-4">
          {user.role === 'store_owner' && <TodayTotalsCard />}
          <LowStockCard />
          {user.role !== 'store_cashier' && <OpenOrdersCard />}
          {user.role !== 'store_cashier' && <UnreadMessagesCard />}
        </div>
      )}
      {user.orgType === 'store' && <QuickActions role={user.role} />}
    </>
  );
}

/** Low-stock card of S05 (US-12 AC2): count of products at or below their minimum, linked to the filtered list. */
function LowStockCard() {
  const { data } = useApi<{ total: number }>('/products?lowStock=true&limit=1');
  const count = data?.total;
  return (
    <Link
      to="/app/products?lowStock=true"
      className="block w-full max-w-xs self-start rounded-xl border border-slate-200 bg-white p-4 hover:border-accent"
    >
      <p className="text-sm text-slate-600">Low-stock products</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${count ? 'text-amber-600' : 'text-slate-900'}`}>
        {count ?? '–'}
      </p>
      <p className="mt-1 text-xs text-primary">View list →</p>
    </Link>
  );
}

/** Today's totals by payment method on S05 (US-22 AC2, owner only). Same numbers as /sales/summary/daily. */
function TodayTotalsCard() {
  const { data } = useApi<DailySummary>('/sales/summary/daily');
  return (
    <Link to="/app/sales" className="block w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 hover:border-primary">
      <p className="text-sm text-slate-600">Today's sales{data ? ` · ${data.salesCount}` : ''}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{data ? formatCOP(data.grandTotal) : '–'}</p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {data?.byMethod.map((m) => (
          <div key={m.method}>
            <dt className="text-slate-500">{METHOD_LABEL[m.method]}</dt>
            <dd className="font-medium tabular-nums">{formatCOP(m.total)}</dd>
          </div>
        ))}
      </dl>
    </Link>
  );
}

/** Open purchase orders on S05 (US-33): pending + accepted + shipped. */
function OpenOrdersCard() {
  const pending = useApi<{ total: number }>('/orders?status=pending&limit=1');
  const accepted = useApi<{ total: number }>('/orders?status=accepted&limit=1');
  const shipped = useApi<{ total: number }>('/orders?status=shipped&limit=1');
  const ready = pending.data && accepted.data && shipped.data;
  return (
    <Link to="/app/orders" className="block w-full max-w-xs self-start rounded-xl border border-slate-200 bg-white p-4 hover:border-primary">
      <p className="text-sm text-slate-600">Open purchase orders</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">
        {ready ? pending.data!.total + accepted.data!.total + shipped.data!.total : '–'}
      </p>
      <p className="mt-1 text-xs text-slate-500">{ready ? `${shipped.data!.total} in transit` : '\u00a0'}</p>
    </Link>
  );
}

/** Quick actions of S05, filtered by what each role can do (the API enforces it again). */
function QuickActions({ role }: { role: string }) {
  const actions = [
    { to: '/app/sales/new', label: 'New sale', roles: ['store_owner', 'store_cashier'] },
    { to: '/app/products/new', label: 'New product', roles: ['store_owner', 'store_inventory'] },
    { to: '/app/orders/new', label: 'New purchase order', roles: ['store_owner', 'store_inventory'] },
    { to: '/app/restock', label: 'Restock suggestions', roles: ['store_owner', 'store_inventory'] },
  ].filter((a) => a.roles.includes(role));
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-medium text-slate-600">Quick actions</h2>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:border-primary hover:text-primary"
          >
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
