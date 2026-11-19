import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge';
import FormAlert from '../../components/FormAlert';
import { useApi } from '../../hooks/useApi';
import type { RestockResponse } from '../../types/insights';
import { UNIT_LABEL } from '../../types/product';
import { formatCOP } from '../../utils/money';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import LoadingState from '../../components/LoadingState';

/** S11 Restock suggestions (US-14, rule BR4), most urgent first. */
export default function RestockPage() {
  const { data, error, loading } = useApi<RestockResponse>('/insights/restock');
  const [onlyUrgent, setOnlyUrgent] = useState(true);
  const rows = data?.data.filter((s) => !onlyUrgent || s.urgent) ?? [];

  return (
    <section className="space-y-4">
      <PageHeader
        title="Restock suggestions"
        subtitle={<>Based on the last {data?.windowDays ?? 30} days of sales: suggested quantity covers 14 days plus your minimum stock.</>}
        actions={
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyUrgent} onChange={(e) => setOnlyUrgent(e.target.checked)} className="h-4 w-4 accent-primary" />
            Only products to restock
          </label>
        }
      />

      <FormAlert message={error} />

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-right font-medium">Avg / day</th>
              <th className="px-4 py-3 text-right font-medium">Days left</th>
              <th className="px-4 py-3 text-right font-medium">Suggested</th>
              <th className="px-4 py-3 font-medium">Best distributor</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((s) => (
              <tr key={s.product}>
                <td className="px-4 py-3">
                  <Link to={`/app/products/${s.product}`} className="font-medium hover:text-primary">
                    {s.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {s.sku} · min {s.minStock}
                  </p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {s.stock} {UNIT_LABEL[s.unit]}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{s.avgDaily}</td>
                <td className="px-4 py-3 text-right">
                  {s.daysLeft === null ? (
                    <span className="text-slate-600">No sales</span>
                  ) : (
                    <span className="inline-flex items-center gap-2 tabular-nums">
                      {s.daysLeft}
                      {s.urgent && <Badge tone={s.daysLeft <= s.leadTimeDays ? 'danger' : 'warning'}>Restock</Badge>}
                    </span>
                  )}
                  {s.daysLeft === null && s.urgent && (
                    <span className="ml-2">
                      <Badge tone="warning">Low stock</Badge>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{s.suggestedQty || '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  {s.bestDistributor ? (
                    `${s.bestDistributor.name} · ${formatCOP(s.bestDistributor.price)}`
                  ) : (
                    <span className="text-slate-600">None yet · lead time {s.leadTimeDays} d</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {s.bestDistributor && (
                    <Link
                      to={`/app/orders/new?distributor=${s.bestDistributor.id}&item=${s.bestDistributor.catalogItem}&qty=${s.suggestedQty || 1}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Order
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data && loading && <LoadingState />}
        {data && rows.length === 0 && (
          <EmptyState title={onlyUrgent ? 'Nothing needs restocking right now.' : 'No products yet.'} />
        )}
      </div>
    </section>
  );
}
