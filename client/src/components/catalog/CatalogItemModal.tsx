import { useForm } from '../../hooks/useForm';
import type { CatalogItem } from '../../types/catalog';
import { CATEGORIES, CATEGORY_LABEL, UNITS, UNIT_LABEL } from '../../types/product';
import Button from '../Button';
import FormAlert from '../FormAlert';
import SelectField from '../SelectField';
import TextField from '../TextField';

export interface CatalogItemPayload {
  name: string;
  category: string;
  unit: string;
  price?: number;
  available: boolean;
}

interface Props {
  item: CatalogItem | null; // null = create
  onSubmit: (payload: CatalogItemPayload) => Promise<unknown>;
  onClose: () => void;
}

/** S20 create/edit modal (US-30). */
export default function CatalogItemModal({ item, onSubmit, onClose }: Props) {
  const form = useForm(
    {
      name: item?.name ?? '',
      category: item?.category ?? 'groceries',
      unit: item?.unit ?? 'unit',
      price: item ? String(item.price) : '',
      available: item ? String(item.available) : 'true',
    },
    (v) =>
      onSubmit({
        name: v.name,
        category: v.category,
        unit: v.unit,
        price: v.price.trim() === '' ? undefined : Number(v.price),
        available: v.available === 'true',
      }),
  );
  const field = (name: keyof typeof form.values) => ({
    name,
    value: form.values[name],
    onChange: form.onChange,
    error: form.errors[name],
  });

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-item-title"
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <h2 id="catalog-item-title" className="mb-4 text-lg font-semibold">
          {item ? 'Edit item' : 'New catalog item'}
        </h2>
        <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
          <FormAlert message={form.formError} />
          <TextField label="Name" {...field('name')} maxLength={80} autoFocus />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Category" {...field('category')} options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))} />
            <SelectField label="Unit" {...field('unit')} options={UNITS.map((u) => ({ value: u, label: UNIT_LABEL[u] }))} />
          </div>
          <TextField label="Price (COP)" type="number" inputMode="numeric" min={1} step={1} {...field('price')} />
          <SelectField
            label="Availability"
            {...field('available')}
            options={[
              { value: 'true', label: 'Available to stores' },
              { value: 'false', label: 'Unavailable (hidden from stores)' },
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={form.submitting}>
              {item ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
