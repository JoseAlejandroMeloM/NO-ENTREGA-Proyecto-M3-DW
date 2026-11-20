import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import CatalogItemModal, { type CatalogItemPayload } from '../../components/catalog/CatalogItemModal';
import FormAlert from '../../components/FormAlert';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import type { CatalogItem, Page } from '../../types/catalog';
import { CATEGORIES, CATEGORY_LABEL, UNIT_LABEL } from '../../types/product';
import { formatCOP } from '../../utils/money';
import EmptyState from '../../components/EmptyState';
import FilterBar from '../../components/FilterBar';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';

const LIMIT = 20;

/** S20 Catalog management (US-30). Staff can read; only the owner edits (the API enforces it). */
export default function CatalogPage() {
  const isOwner = useAuth().session?.user.role === 'distributor_owner';
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<CatalogItem | null | undefined>(undefined); // undefined = closed
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const query = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (q) query.set('q', q);
  if (category) query.set('category', category);
  const { data, error, loading, reload } = useApi<Page<CatalogItem>>(`/catalog?${query}`);
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  const save = async (payload: CatalogItemPayload) => {
    const body = JSON.stringify(payload);
    if (editing) await api(`/catalog/${editing.id}`, { method: 'PATCH', body });
    else await api('/catalog', { method: 'POST', body });
    setEditing(undefined);
    reload();
  };

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await fn();
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    }
  };
  const toggle = (item: CatalogItem) =>
    run(() => api(`/catalog/${item.id}`, { method: 'PATCH', body: JSON.stringify({ available: !item.available }) }));
  const remove = (item: CatalogItem) => {
    if (window.confirm(`Delete "${item.name}" from your catalog?`)) run(() => api(`/catalog/${item.id}`, { method: 'DELETE' }));
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Catalog"
        subtitle={data ? `${data.total} item${data.total === 1 ? '' : 's'}` : 'What stores can order from you.'}
        actions={
          isOwner && <Button onClick={() => setEditing(null)}>New item</Button>
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
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
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

      <FormAlert message={error ?? actionError} />

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Availability</th>
              {isOwner && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                <td className="px-4 py-3 text-slate-600">{CATEGORY_LABEL[item.category]}</td>
                <td className="px-4 py-3 text-slate-600">{UNIT_LABEL[item.unit]}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(item.price)}</td>
                <td className="px-4 py-3">
                  {isOwner ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.available}
                      aria-label={`${item.name} available`}
                      onClick={() => toggle(item)}
                      className={`relative h-6 w-11 rounded-full transition ${item.available ? 'bg-primary' : 'bg-slate-300'}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface shadow transition ${item.available ? 'translate-x-5' : ''}`}
                      />
                    </button>
                  ) : (
                    <Badge tone={item.available ? 'success' : 'neutral'}>{item.available ? 'Available' : 'Unavailable'}</Badge>
                  )}
                </td>
                {isOwner && (
                  <td className="space-x-1 px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" onClick={() => setEditing(item)}>
                      Edit
                    </Button>
                    <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => remove(item)}>
                      Delete
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!data && loading && <LoadingState />}
        {data && data.data.length === 0 && (
          <EmptyState title={q || category ? 'No items match these filters.' : 'Your catalog is empty. Add the products you sell.'} />
        )}
      </div>

      <Pagination page={page} pages={pages} onChange={setPage} />

      {editing !== undefined && <CatalogItemModal item={editing} onSubmit={save} onClose={() => setEditing(undefined)} />}
    </section>
  );
}
