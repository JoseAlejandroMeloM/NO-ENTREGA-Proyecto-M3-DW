import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FormAlert from '../../components/FormAlert';
import StockBadge from '../../components/products/StockBadge';
import { useApi } from '../../hooks/useApi';
import { useCanManageInventory } from '../../hooks/useCanManageInventory';
import { CATEGORIES, CATEGORY_LABEL, type ProductPage } from '../../types/product';
import { formatCOP } from '../../utils/money';
import ButtonLink from '../../components/ButtonLink';
import EmptyState from '../../components/EmptyState';
import FilterBar from '../../components/FilterBar';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';

const LIMIT = 20;

/** S06 Products list (US-10 AC2). Filters live in the URL so the dashboard can link to ?lowStock=true. */
export default function ProductsPage() {
  const canManage = useCanManageInventory();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const lowStock = params.get('lowStock') === 'true';
  const page = Number(params.get('page') ?? '1') || 1;
  const [search, setSearch] = useState(q);

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in changes)) next.delete('page'); // any filter change goes back to page 1
    setParams(next, { replace: true });
  };

  // Debounce typing so the API is not called on every key.
  useEffect(() => {
    if (search === q) return;
    const id = setTimeout(() => update({ q: search.trim() || null }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text should restart the timer
  }, [search]);

  const query = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (q) query.set('q', q);
  if (category) query.set('category', category);
  if (lowStock) query.set('lowStock', 'true');
  const { data, error, loading } = useApi<ProductPage>(`/products?${query}`);
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <section className="space-y-4">
      <PageHeader
        title="Products"
        subtitle={data ? `${data.total} product${data.total === 1 ? '' : 's'}` : 'Your store catalog and stock.'}
        actions={
          canManage && (
            <ButtonLink to="/app/products/new">New product</ButtonLink>
          )
        }
      />

      <FilterBar>
        <label className="min-w-48 flex-1">
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU"
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
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 py-2 text-sm">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => update({ lowStock: e.target.checked ? 'true' : null })}
            className="h-4 w-4 accent-primary"
          />
          Low stock only
        </label>
      </FilterBar>

      <FormAlert message={error} />

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 text-right font-medium">Min.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/app/products/${p.id}`} className="font-medium text-slate-900 hover:text-primary">
                    {p.name}
                  </Link>
                  <p className="text-xs text-slate-500">{p.sku}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{CATEGORY_LABEL[p.category]}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(p.price)}</td>
                <td className="px-4 py-3">
                  <StockBadge product={p} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{p.minStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data && loading && <LoadingState />}
        {data && data.data.length === 0 && (
          <EmptyState title={q || category || lowStock ? 'No products match these filters.' : 'No products yet.'} />
        )}
      </div>

      <Pagination page={page} pages={pages} onChange={(p) => update({ page: String(p) })} />
    </section>
  );
}
