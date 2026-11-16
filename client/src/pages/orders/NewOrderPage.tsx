import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import Button from '../../components/Button';
import FormAlert from '../../components/FormAlert';
import { useApi } from '../../hooks/useApi';
import type { CatalogItem, Distributor, Page } from '../../types/catalog';
import type { PurchaseOrder } from '../../types/order';
import { UNIT_LABEL } from '../../types/product';
import { formatCOP } from '../../utils/money';
import EmptyState from '../../components/EmptyState';

/**
 * S15 New purchase order (US-32). Opened from S13 ("Add to order") or S11 ("Order") with
 * ?distributor=…&item=…&qty=… prefilled. The total shown here is a preview; the server prices the order.
 */
export default function NewOrderPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const distributorId = params.get('distributor') ?? '';
  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const item = params.get('item');
    return item ? { [item]: params.get('qty') || '1' } : {};
  });
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const directory = useApi<Page<Distributor>>(distributorId ? null : '/distributors?limit=100');
  const distributor = useApi<Distributor>(distributorId ? `/distributors/${distributorId}` : null);
  const catalog = useApi<Page<CatalogItem>>(distributorId ? `/distributors/${distributorId}/catalog?limit=100` : null);

  const lines = (catalog.data?.data ?? [])
    .map((item) => ({ item, quantity: Number(quantities[item.id] ?? 0) }))
    .filter((l) => Number.isInteger(l.quantity) && l.quantity > 0);
  const total = lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0);
  const minimum = distributor.data?.minimumOrder ?? 0;
  const missing = Math.max(0, minimum - total);

  const pick = (id: string) => {
    setQuantities({});
    setParams(id ? { distributor: id } : {}, { replace: true });
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const order = await api<PurchaseOrder>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          distributor: distributorId,
          items: lines.map((l) => ({ catalogItem: l.item.id, quantity: l.quantity })),
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });
      navigate(`/app/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Check your connection.');
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <Link to="/app/orders" className="text-sm text-primary hover:underline">
        ← Orders
      </Link>
      <h1 className="text-2xl font-semibold">New purchase order</h1>

      {!distributorId && (
        <label className="block max-w-md">
          <span className="text-sm font-medium text-slate-700">Distributor</span>
          <select
            value=""
            onChange={(e) => pick(e.target.value)}
            className="mt-1 block w-full field"
          >
            <option value="">Choose a distributor…</option>
            {directory.data?.data.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · min. {formatCOP(d.minimumOrder)}
              </option>
            ))}
          </select>
        </label>
      )}

      {distributor.data && (
        <div className="flex flex-wrap items-center justify-between gap-3 card p-4">
          <div>
            <p className="font-semibold">{distributor.data.name}</p>
            <p className="text-sm text-slate-600">
              Delivers in {distributor.data.deliveryDays} day{distributor.data.deliveryDays === 1 ? '' : 's'} · minimum order{' '}
              {formatCOP(minimum)}
            </p>
          </div>
          <Button variant="secondary" onClick={() => pick('')}>
            Change distributor
          </Button>
        </div>
      )}

      <FormAlert message={distributor.error ?? catalog.error ?? error} />

      {distributorId && (
        <>
          <div className="overflow-x-auto card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalog.data?.data.map((item) => {
                  const q = Number(quantities[item.id] ?? 0);
                  return (
                    <tr key={item.id} className={q > 0 ? 'bg-primary-soft/40' : ''}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">per {UNIT_LABEL[item.unit]}</p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCOP(item.price)}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          aria-label={`Quantity of ${item.name}`}
                          value={quantities[item.id] ?? ''}
                          placeholder="0"
                          onChange={(e) => setQuantities((qs) => ({ ...qs, [item.id]: e.target.value }))}
                          className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm tabular-nums"
                        />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{q > 0 ? formatCOP(item.price * q) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {catalog.data && catalog.data.data.length === 0 && (
              <EmptyState title="This distributor has no available items." />
            )}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Note for the distributor (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              rows={2}
              className="mt-1 block w-full field"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 card p-4">
            <div>
              <p className="text-sm text-slate-600">Total ({lines.length} item{lines.length === 1 ? '' : 's'})</p>
              <p className="text-2xl font-semibold tabular-nums">{formatCOP(total)}</p>
              <p className={`text-sm ${missing > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                {missing > 0 ? `Add ${formatCOP(missing)} more to reach the minimum order` : 'Minimum order reached'}
              </p>
            </div>
            <Button onClick={submit} loading={submitting} disabled={lines.length === 0}>
              Send order
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
