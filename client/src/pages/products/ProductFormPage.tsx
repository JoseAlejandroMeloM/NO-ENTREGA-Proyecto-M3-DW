import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError, patch, post } from '../../api/client';
import Button from '../../components/Button';
import FormAlert from '../../components/FormAlert';
import AdjustmentPanel from '../../components/products/AdjustmentPanel';
import MovementHistory from '../../components/products/MovementHistory';
import ProductForm, { type ProductPayload } from '../../components/products/ProductForm';
import StockBadge from '../../components/products/StockBadge';
import { useApi } from '../../hooks/useApi';
import { useCanManageInventory } from '../../hooks/useCanManageInventory';
import type { MovementPage, Product } from '../../types/product';
import BackLink from '../../components/BackLink';

/** S07 Product form: /app/products/new (create) and /app/products/:id (edit, adjust, history). */
export default function ProductFormPage() {
  const { id } = useParams();
  return id ? <EditProduct id={id} /> : <CreateProduct />;
}

function Header({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <BackLink to="/app/products">Products</BackLink>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      {children}
    </div>
  );
}

function CreateProduct() {
  const navigate = useNavigate();
  const create = async (payload: ProductPayload) => {
    const product = await post<Product>('/products', payload);
    navigate(`/app/products/${product.id}`, { state: { flash: 'Product created.' } });
  };
  return (
    <section className="max-w-3xl space-y-4">
      <Header title="New product" />
      <ProductForm onSubmit={create} submitLabel="Create product" />
    </section>
  );
}

function EditProduct({ id }: { id: string }) {
  const navigate = useNavigate();
  const flash = (useLocation().state as { flash?: string } | null)?.flash;
  const canManage = useCanManageInventory();
  const product = useApi<Product>(`/products/${id}`);
  const history = useApi<MovementPage>(`/products/${id}/movements?limit=20`);
  const [saved, setSaved] = useState<string | null>(flash ?? null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (product.error && !product.data) {
    return (
      <section className="space-y-4">
        <Header title="Product" />
        <FormAlert message={product.error} />
      </section>
    );
  }
  if (!product.data) return <p className="text-slate-500">Loading…</p>;
  const p = product.data;

  const save = async (payload: ProductPayload) => {
    setSaved(null);
    await patch<Product>(`/products/${id}`, payload);
    product.reload();
    history.reload();
    setSaved('Changes saved.');
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${p.name}"? It disappears from the list; past sales keep its name.`)) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api<null>(`/products/${id}`, { method: 'DELETE' });
      navigate('/app/products', { replace: true });
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Could not delete the product');
      setDeleting(false);
    }
  };

  return (
    <section className="space-y-4">
      <Header title={p.name}>
        <StockBadge product={p} />
      </Header>
      {saved && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {saved}
        </p>
      )}
      <FormAlert message={deleteError} />
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <ProductForm
          key={p.updatedAt} // reset the form to the saved values after each save
          product={p}
          readOnly={!canManage}
          onSubmit={save}
          submitLabel="Save changes"
          extraActions={
            <Button type="button" variant="danger" onClick={remove} loading={deleting}>
              Delete
            </Button>
          }
        />
        <div className="space-y-4">
          {canManage && (
            <AdjustmentPanel
              key={p.updatedAt} // empties the form after each adjustment
              product={p}
              onAdjusted={() => {
                setSaved('Stock updated.');
                product.reload();
                history.reload();
              }}
            />
          )}
          <MovementHistory data={history.data} loading={history.loading} />
        </div>
      </div>
    </section>
  );
}
