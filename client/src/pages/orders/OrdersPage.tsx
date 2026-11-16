import { Link, useSearchParams } from 'react-router-dom';
import FormAlert from '../../components/FormAlert';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { useApi } from '../../hooks/useApi';
import { ORDER_STATUSES, STATUS_LABEL, type OrderPage } from '../../types/order';
import { formatCOP } from '../../utils/money';
import ButtonLink from '../../components/ButtonLink';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Tabs from '../../components/Tabs';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';

const LIMIT = 20;
const date = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'medium' });

/** S16 (store) and S21 (distributor) order lists with status tabs (US-33, US-34). The API scopes by organization. */
export default function OrdersPage({ side }: { side: 'store' | 'distributor' }) {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const page = Number(params.get('page') ?? '1') || 1;
  const base = side === 'store' ? '/app/orders' : '/dist/orders';

  const query = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (status) query.set('status', status);
  const { data, error, loading } = useApi<OrderPage>(`/orders?${query}`);
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const go = (next: Record<string, string>) => setParams(next, { replace: true });

  return (
    <section className="space-y-4">
      <PageHeader
        title={side === 'store' ? 'Purchase orders' : 'Incoming orders'}
        subtitle={data ? `${data.total} order${data.total === 1 ? '' : 's'}` : side === 'store' ? 'What you ordered from distributors.' : 'Orders stores sent you.'}
        actions={
          side === 'store' && (
            <ButtonLink to="/app/orders/new">New order</ButtonLink>
          )
        }
      />

      <Tabs
        label="Order status"
        tabs={[{ label: 'All', value: '' }, ...ORDER_STATUSES.map((s) => ({ label: STATUS_LABEL[s], value: s as string }))]}
        value={status}
        onChange={(s) => go(s ? { status: s } : {})}
      />

      <FormAlert message={error} />

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">{side === 'store' ? 'Distributor' : 'Store'}</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`${base}/${o.id}`} className="font-medium text-slate-900 hover:text-primary">
                    {o.code}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {o.items.length} item{o.items.length === 1 ? '' : 's'}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-700">{side === 'store' ? o.distributor.name : o.store.name}</td>
                <td className="px-4 py-3 text-slate-600">{date(o.createdAt)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(o.total)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data && loading && <LoadingState />}
        {data && data.data.length === 0 && (
          <EmptyState title={status ? `No ${STATUS_LABEL[status as keyof typeof STATUS_LABEL].toLowerCase()} orders.` : 'No orders yet.'} />
        )}
      </div>

      <Pagination page={page} pages={pages} onChange={(p) => go({ ...(status ? { status } : {}), page: String(p) })} />
    </section>
  );
}
