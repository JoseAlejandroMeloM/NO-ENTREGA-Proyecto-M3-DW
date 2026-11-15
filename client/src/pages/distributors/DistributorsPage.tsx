import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge';
import FormAlert from '../../components/FormAlert';
import Rating from '../../components/catalog/Rating';
import { useApi } from '../../hooks/useApi';
import type { Distributor, Page } from '../../types/catalog';
import { CATEGORIES, CATEGORY_LABEL } from '../../types/product';
import { formatCOP } from '../../utils/money';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** S12 Distributors directory (US-31). The category filter only lists distributors with available items in it. */
export default function DistributorsPage() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const query = new URLSearchParams({ limit: '100' });
  if (q) query.set('q', q);
  if (category) query.set('category', category);
  const { data, error, loading } = useApi<Page<Distributor>>(`/distributors?${query}`);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Distributors</h1>
          <p className="text-sm text-slate-600">{data ? plural(data.total, 'distributor') : 'Find who supplies what you sell.'}</p>
        </div>
        <Link
          to="/app/compare"
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Compare prices
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <label className="min-w-48 flex-1">
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            maxLength={80}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
        </label>
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

      <FormAlert message={error} />
      {!data && loading && <p className="py-8 text-center text-sm text-slate-500">Loading…</p>}
      {data && data.data.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
          {q || category ? 'No distributors match these filters.' : 'No distributors yet.'}
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.data.map((d) => (
          <li key={d.id}>
            <Link
              to={`/app/distributors/${d.id}`}
              className="block h-full space-y-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-primary"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{d.name}</h2>
                <span className="text-sm">
                  <Rating average={d.ratingAverage} count={d.ratingCount} />
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Delivery</dt>
                  <dd>{plural(d.deliveryDays, 'day')}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Minimum order</dt>
                  <dd className="tabular-nums">{formatCOP(d.minimumOrder)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-slate-500">Coverage</dt>
                  <dd className="text-slate-700">{d.coverageArea}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-1">
                {d.categories.length === 0 ? (
                  <span className="text-xs text-slate-500">No items yet</span>
                ) : (
                  d.categories.map((c) => <Badge key={c}>{CATEGORY_LABEL[c]}</Badge>)
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
