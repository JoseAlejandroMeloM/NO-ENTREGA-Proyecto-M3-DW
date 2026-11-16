import { ClipboardList, PackagePlus, ShoppingBasket, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import ButtonLink from '../components/ButtonLink';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import UnreadMessagesCard from '../components/orders/UnreadMessagesCard';
import { useApi } from '../hooks/useApi';
import { METHOD_LABEL, type DailySummary } from '../types/sale';
import { formatCOP } from '../utils/money';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABEL } from '../layouts/nav';

const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
// Fill colors of the payment-method bar; same hues as MethodBadge.
const METHOD_BAR = { cash: 'bg-green-600', nequi: 'bg-amber-500', card: 'bg-blue-600' } as const;

/** S05 Store dashboard: today's totals (owner), low stock, open orders, unread messages and quick actions. */
export default function Home() {
  const { session } = useAuth();
  if (!session) return null;
  const { user } = session;
  return (
    <section className="space-y-6">
      <PageHeader
        title={`Hello, ${user.name.split(' ')[0]}`}
        subtitle={`${TODAY} · ${ROLE_LABEL[user.role]}`}
        actions={
          user.role !== 'store_inventory' &&
          user.orgType === 'store' && (
            <ButtonLink to="/app/sales/new" size="lg">
              <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
              New sale
            </ButtonLink>
          )
        }
      />
      {user.orgType === 'store' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user.role === 'store_owner' && <TodayTotalsCard />}
          <LowStockCard />
          {user.role !== 'store_cashier' && <OpenOrdersCard />}
          {user.role !== 'store_cashier' && <UnreadMessagesCard />}
        </div>
      )}
      {user.orgType === 'store' && <QuickActions role={user.role} />}
    </section>
  );
}

/** Low-stock card of S05 (US-12 AC2): count of products at or below their minimum, linked to the filtered list. */
function LowStockCard() {
  const { data } = useApi<{ total: number }>('/products?lowStock=true&limit=1');
  const count = data?.total;
  return (
    <StatCard
      to="/app/products?lowStock=true"
      label="Low-stock products"
      value={count ?? '–'}
      tone={count ? 'warning' : 'default'}
      linkLabel="View list"
    />
  );
}

/** Today's totals by payment method on S05 (US-22 AC2, owner only). Same numbers as /sales/summary/daily. */
function TodayTotalsCard() {
  const { data } = useApi<DailySummary>('/sales/summary/daily');
  return (
    <Link
      to="/app/sales"
      className="group card grid gap-6 p-5 transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-raised sm:col-span-2 sm:p-6 lg:col-span-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-end"
    >
      <div>
        <p className="text-sm text-slate-600">Today's sales</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{data ? formatCOP(data.grandTotal) : '–'}</p>
        <p className="mt-2 text-sm text-slate-600">{data ? `${data.salesCount} sale${data.salesCount === 1 ? '' : 's'} so far` : '\u00a0'}</p>
      </div>
      <div>
        {/* One bar split by payment method; the numbers below say the same for screen readers. */}
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          {data?.byMethod.map((m) => (
            <span key={m.method} className={METHOD_BAR[m.method]} style={{ width: `${data.grandTotal ? (m.total / data.grandTotal) * 100 : 0}%` }} />
          ))}
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
          {data?.byMethod.map((m) => (
            <div key={m.method}>
              <dt className="flex items-center gap-1.5 text-slate-600">
                <span className={`h-2 w-2 rounded-full ${METHOD_BAR[m.method]}`} aria-hidden="true" />
                {METHOD_LABEL[m.method]}
              </dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{formatCOP(m.total)}</dd>
            </div>
          ))}
        </dl>
      </div>
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
    <StatCard
      to="/app/orders"
      label="Open purchase orders"
      value={ready ? pending.data!.total + accepted.data!.total + shipped.data!.total : '–'}
      hint={ready ? `${shipped.data!.total} in transit` : '\u00a0'}
      linkLabel="View orders"
    />
  );
}

/** Quick actions of S05, filtered by what each role can do (the API enforces it again). */
function QuickActions({ role }: { role: string }) {
  const actions = [
    { to: '/app/products/new', label: 'New product', icon: PackagePlus, roles: ['store_owner', 'store_inventory'] },
    { to: '/app/orders/new', label: 'New purchase order', icon: ClipboardList, roles: ['store_owner', 'store_inventory'] },
    { to: '/app/restock', label: 'Restock suggestions', icon: Sparkles, roles: ['store_owner', 'store_inventory'] },
  ].filter((a) => a.roles.includes(role));
  if (actions.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Quick actions</h2>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <ButtonLink key={a.to} to={a.to} variant="secondary">
            <a.icon className="h-4 w-4 text-primary" aria-hidden="true" />
            {a.label}
          </ButtonLink>
        ))}
      </div>
    </div>
  );
}
