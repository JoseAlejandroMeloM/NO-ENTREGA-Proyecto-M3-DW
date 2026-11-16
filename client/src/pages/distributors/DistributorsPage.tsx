import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge';
import FormAlert from '../../components/FormAlert';
import Rating from '../../components/catalog/Rating';
import { useApi } from '../../hooks/useApi';
import type { Distributor, Page } from '../../types/catalog';
import { CATEGORIES, CATEGORY_LABEL } from '../../types/product';
import { formatCOP } from '../../utils/money';
import ButtonLink from '../../components/ButtonLink';
import EmptyState from '../../components/EmptyState';
import FilterBar from '../../components/FilterBar';
import PageHeader from '../../components/PageHeader';
import { ArrowRight } from 'lucide-react';

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
      <PageHeader
        title="Distributors"
        subtitle={data ? plural(data.total, 'distributor') : 'Find who supplies what you sell.'}
        actions={
          <ButtonLink variant="secondary" to="/app/compare">Compare prices</ButtonLink>
        }
      />

      <FilterBar>
        <label className="min-w-48 flex-1">
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            maxLength={80}
            className="block w-full field"
          />
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
      </FilterBar>

      <FormAlert message={error} />
      {!data && loading && <p className="py-8 text-center text-sm text-slate-500">Loading…</p>}
      {data && data.data.length === 0 && (
        <div className="card">
          <EmptyState title={q || category ? 'No distributors match these filters.' : 'No distributors yet.'} />
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.data.map((d) => (
          <li key={d.id}>
            <Link
              to={`/app/distributors/${d.id}`}
              className="group card flex h-full flex-col gap-3 p-4 transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-raised"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-slate-900">{d.name}</h2>
                <span className="text-sm">
                  <Rating average={d.ratingAverage} count={d.ratingCount} />
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-600">Delivery</dt>
                  <dd>{plural(d.deliveryDays, 'day')}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Minimum order</dt>
                  <dd className="tabular-nums">{formatCOP(d.minimumOrder)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-slate-600">Coverage</dt>
                  <dd className="text-slate-700">{d.coverageArea}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-1">
                {d.categories.length === 0 ? (
                  <span className="text-xs text-slate-600">No items yet</span>
                ) : (
                  d.categories.map((c) => <Badge key={c}>{CATEGORY_LABEL[c]}</Badge>)
                )}
              </div>
              <p className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-primary">
                View catalog
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
