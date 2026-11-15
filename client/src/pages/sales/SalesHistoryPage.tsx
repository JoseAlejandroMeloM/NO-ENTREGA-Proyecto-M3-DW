import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../../components/Button';
import FormAlert from '../../components/FormAlert';
import MethodBadge from '../../components/sales/MethodBadge';
import SaleDrawer from '../../components/sales/SaleDrawer';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types/auth';
import { METHOD_LABEL, PAYMENT_METHODS, type Sale, type SalePage } from '../../types/sale';
import { formatCOP } from '../../utils/money';

const LIMIT = 20;
const inputClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';

/** S09 Sales history (US-21). Cashiers only get their own sales from the API. */
export default function SalesHistoryPage() {
  const role = useAuth().session?.user.role;
  const isOwner = role === 'store_owner';
  const canSell = role === 'store_owner' || role === 'store_cashier';
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState<Sale | null>(null);
  const close = useCallback(() => setOpen(null), []);

  const get = (k: string) => params.get(k) ?? '';
  const page = Number(get('page') || '1') || 1;
  const update = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const query = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  for (const k of ['from', 'to', 'paymentMethod', 'cashier']) if (get(k)) query.set(k, get(k));
  const { data, error, loading } = useApi<SalePage>(`/sales?${query}`);
  // Only the owner can list the team (and filter by cashier).
  const team = useApi<{ data: User[] }>(isOwner ? '/users' : null);
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Sales</h1>
          <p className="text-sm text-slate-600">
            {role === 'store_cashier' ? 'Your sales.' : 'All sales of the store.'} {data && `${data.total} found.`}
          </p>
        </div>
        {canSell && (
          <Link
            to="/app/sales/new"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            New sale
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <label>
          <span className="block text-xs text-slate-500">From</span>
          <input type="date" value={get('from')} onChange={(e) => update('from', e.target.value)} className={inputClass} />
        </label>
        <label>
          <span className="block text-xs text-slate-500">To</span>
          <input type="date" value={get('to')} onChange={(e) => update('to', e.target.value)} className={inputClass} />
        </label>
        <label>
          <span className="block text-xs text-slate-500">Payment</span>
          <select value={get('paymentMethod')} onChange={(e) => update('paymentMethod', e.target.value)} className={inputClass}>
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABEL[m]}
              </option>
            ))}
          </select>
        </label>
        {isOwner && (
          <label>
            <span className="block text-xs text-slate-500">Cashier</span>
            <select value={get('cashier')} onChange={(e) => update('cashier', e.target.value)} className={inputClass}>
              <option value="">Everyone</option>
              {team.data?.data
                .filter((u) => u.role === 'store_owner' || u.role === 'store_cashier')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </label>
        )}
      </div>

      <FormAlert message={error} />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Cashier</th>
              <th className="px-4 py-3 text-right font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data.map((s) => (
              <tr key={s.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(s)}>
                <td className="px-4 py-3">
                  <button type="button" className="text-left hover:text-primary" onClick={() => setOpen(s)}>
                    {new Date(s.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-600">{s.cashier?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums">{s.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td className="px-4 py-3">
                  <MethodBadge method={s.paymentMethod} />
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{formatCOP(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data && loading && <p className="px-4 py-8 text-center text-sm text-slate-500">Loading…</p>}
        {data && data.data.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">No sales found.</p>}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button variant="secondary" onClick={() => update('page', String(page - 1))} disabled={page <= 1}>
            Previous
          </Button>
          <span className="text-slate-600">
            Page {page} of {pages}
          </span>
          <Button variant="secondary" onClick={() => update('page', String(page + 1))} disabled={page >= pages}>
            Next
          </Button>
        </div>
      )}

      {open && <SaleDrawer sale={open} onClose={close} />}
    </section>
  );
}
