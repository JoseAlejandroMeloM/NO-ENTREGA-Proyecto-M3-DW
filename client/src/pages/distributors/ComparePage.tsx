import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FormAlert from '../../components/FormAlert';
import Rating from '../../components/catalog/Rating';
import { useApi } from '../../hooks/useApi';
import type { CompareSort, ComparisonRow } from '../../types/catalog';
import { CATEGORIES, CATEGORY_LABEL, UNIT_LABEL } from '../../types/product';
import { formatCOP } from '../../utils/money';
import EmptyState from '../../components/EmptyState';
import FilterBar from '../../components/FilterBar';
import PageHeader from '../../components/PageHeader';
import LoadingState from '../../components/LoadingState';

const SORTS: { value: CompareSort; label: string }[] = [
  { value: 'price', label: 'Lowest price' },
  { value: 'deliveryDays', label: 'Fastest delivery' },
  { value: 'rating', label: 'Best rating' },
];

/** S14 Compare distributors (US-31): one row per distributor with its cheapest matching item. State lives in the URL. */
export default function ComparePage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const sort = (params.get('sort') as CompareSort) || 'price';
  const [search, setSearch] = useState(q);

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (search === q) return;
    const id = setTimeout(() => update({ q: search.trim() || null }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text should restart the timer
  }, [search]);

  const query = new URLSearchParams({ sort });
  if (q) query.set('q', q);
  if (category) query.set('category', category);
  const ready = Boolean(q || category); // the API answers 400 without a name or category
  const { data, error, loading } = useApi<{ data: ComparisonRow[] }>(ready ? `/distributors/compare?${query}` : null);

  return (
    <section className="space-y-4">
      <PageHeader title="Compare distributors" subtitle="Search a product or pick a category to see who offers it and at what price." />

      <FilterBar>
        <label className="min-w-48 flex-1">
          <span className="sr-only">Product</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Product name, e.g. arroz"
            maxLength={80}
            className="block w-full field"
          />
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select
            value={category}
            onChange={(e) => update({ category: e.target.value || null })}
            className="field"
          >
            <option value="">Any category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Sort by</span>
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="field"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </FilterBar>

      <FormAlert message={error} />

      {ready && (
        <div className="overflow-x-auto card">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Distributor</th>
                <th className="px-4 py-3 font-medium">Best match</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Delivery</th>
                <th className="px-4 py-3 text-right font-medium">Min. order</th>
                <th className="px-4 py-3 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.data.map((r, i) => (
                <tr key={r.distributor.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/app/distributors/${r.distributor.id}`} className="font-medium text-slate-900 hover:text-primary">
                      {r.distributor.name}
                    </Link>
                    <p className="text-xs text-slate-500">{r.distributor.coverageArea}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {r.item.name} <span className="text-xs text-slate-500">/ {UNIT_LABEL[r.item.unit]}</span>
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums ${i === 0 && sort === 'price' ? 'font-semibold text-primary' : ''}`}>
                    {formatCOP(r.item.price)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.distributor.deliveryDays} d
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCOP(r.distributor.minimumOrder)}</td>
                  <td className="px-4 py-3">
                    <Rating average={r.distributor.ratingAverage} count={r.distributor.ratingCount} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data && loading && <LoadingState />}
          {data && data.data.length === 0 && (
            <EmptyState title="No distributor offers a matching item right now." />
          )}
        </div>
      )}
    </section>
  );
}
