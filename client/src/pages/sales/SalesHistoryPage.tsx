import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { ApiError, download } from '../../api/client';
import Button from '../../components/Button';
import FormAlert from '../../components/FormAlert';
import Badge from '../../components/Badge';
import MethodBadge from '../../components/sales/MethodBadge';
import SaleDrawer from '../../components/sales/SaleDrawer';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types/auth';
import { METHOD_LABEL, PAYMENT_METHODS, type Sale, type SalePage } from '../../types/sale';
import { formatCOP } from '../../utils/money';
import ButtonLink from '../../components/ButtonLink';
import EmptyState from '../../components/EmptyState';
import FilterBar from '../../components/FilterBar';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';

const LIMIT = 20;
const inputClass = 'field';

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
  const { data, error, loading, reload } = useApi<SalePage>(`/sales?${query}`);
  // Only the owner can list the team (and filter by cashier).
  const team = useApi<{ data: User[] }>(isOwner ? '/users' : null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  // Owner only (add-sales-export): the same filters as the list, without paging. The API caps it at 92 days.
  const exportCsv = async () => {
    const q = new URLSearchParams();
    for (const k of ['from', 'to', 'paymentMethod', 'cashier']) if (get(k)) q.set(k, get(k));
    setExporting(true);
    setExportError(null);
    try {
      await download(`/sales/export?${q}`, 'sales.csv');
    } catch (err) {
      setExportError(err instanceof ApiError ? (err.details[0]?.message ?? err.message) : 'Could not export the sales');
    } finally {
      setExporting(false);
    }
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <section className="space-y-4">
      <PageHeader
        title="Sales"
        subtitle={<>{role === 'store_cashier' ? 'Your sales.' : 'All sales of the store.'} {data && `${data.total} found.`}</>}
        actions={
          <>
            {isOwner && (
              <Button
                variant="secondary"
                onClick={exportCsv}
                loading={exporting}
                title="Download the sales matching the filters (last 30 days if no dates; at most 92 days)"
              >
                {!exporting && <Download className="h-4 w-4" aria-hidden="true" />}
                Export CSV
              </Button>
            )}
            {canSell && <ButtonLink to="/app/sales/new">New sale</ButtonLink>}
          </>
        }
      />

      <FilterBar className="text-sm">
        <label>
          <span className="mb-1 block text-xs font-medium text-slate-600">From</span>
          <input type="date" value={get('from')} onChange={(e) => update('from', e.target.value)} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-slate-600">To</span>
          <input type="date" value={get('to')} onChange={(e) => update('to', e.target.value)} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-slate-600">Payment</span>
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
            <span className="mb-1 block text-xs font-medium text-slate-600">Cashier</span>
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
      </FilterBar>

      <FormAlert message={exportError ?? error} />

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[34rem] text-left text-sm">
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
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {s.voidedAt ? (
                    <span className="inline-flex items-center gap-2">
                      <Badge tone="danger">Voided</Badge>
                      <span className="text-slate-400 line-through">{formatCOP(s.total)}</span>
                    </span>
                  ) : (
                    formatCOP(s.total)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data && loading && <LoadingState />}
        {data && data.data.length === 0 && <EmptyState title="No sales found." />}
      </div>

      <Pagination page={page} pages={pages} onChange={(p) => update('page', String(p))} />

      {open && (
        <SaleDrawer
          sale={open}
          onClose={close}
          canVoid={isOwner}
          onVoided={(voided) => {
            setOpen(voided);
            reload();
          }}
        />
      )}
    </section>
  );
}
