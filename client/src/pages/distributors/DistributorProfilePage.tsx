import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../../components/Badge';
import FormAlert from '../../components/FormAlert';
import Rating from '../../components/catalog/Rating';
import { useApi } from '../../hooks/useApi';
import type { CatalogItem, Distributor, Page } from '../../types/catalog';
import { CATEGORIES, CATEGORY_LABEL, UNIT_LABEL } from '../../types/product';
import { formatCOP } from '../../utils/money';

/** S13 Distributor profile + available catalog (US-31) with "Add to order" (US-32). */
export default function DistributorProfilePage() {
  const { id } = useParams();
  const [category, setCategory] = useState('');
  const profile = useApi<Distributor>(`/distributors/${id}`);
  const query = new URLSearchParams({ limit: '100' });
  if (category) query.set('category', category);
  const catalog = useApi<Page<CatalogItem>>(`/distributors/${id}/catalog?${query}`);
  const d = profile.data;

  return (
    <section className="space-y-4">
      <Link to="/app/distributors" className="text-sm text-primary hover:underline">
        ← Distributors
      </Link>
      <FormAlert message={profile.error} />
      {d && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{d.name}</h1>
              <p className="text-sm text-slate-600">
                NIT {d.nit} · {d.phone}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Rating average={d.ratingAverage} count={d.ratingCount} />
              <Link
                to={`/app/orders/new?distributor=${d.id}`}
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                New order
              </Link>
            </div>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">Delivery time</dt>
              <dd className="font-medium">
                {d.deliveryDays} day{d.deliveryDays === 1 ? '' : 's'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Minimum order</dt>
              <dd className="font-medium tabular-nums">{formatCOP(d.minimumOrder)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Coverage</dt>
              <dd className="font-medium">{d.coverageArea}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-1">
            {d.categories.map((c) => (
              <Badge key={c}>{CATEGORY_LABEL[c]}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Catalog</h2>
        <label>
          <span className="sr-only">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <FormAlert message={catalog.error} />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {catalog.data?.data.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                <td className="px-4 py-3 text-slate-600">{CATEGORY_LABEL[item.category]}</td>
                <td className="px-4 py-3 text-slate-600">{UNIT_LABEL[item.unit]}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(item.price)}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/app/orders/new?distributor=${id}&item=${item.id}`} className="font-medium text-primary hover:underline">
                    Add to order
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!catalog.data && catalog.loading && <p className="px-4 py-8 text-center text-sm text-slate-500">Loading…</p>}
        {catalog.data && catalog.data.data.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No available items{category ? ' in this category' : ''}.</p>
        )}
      </div>
    </section>
  );
}
