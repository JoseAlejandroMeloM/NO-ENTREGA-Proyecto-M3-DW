import { useForm } from '../../hooks/useForm';
import { CATEGORIES, CATEGORY_LABEL, UNITS, UNIT_LABEL, type Product } from '../../types/product';
import Button from '../Button';
import FormAlert from '../FormAlert';
import SelectField from '../SelectField';
import TextField from '../TextField';

export interface ProductPayload {
  name: string;
  sku: string;
  category: string;
  unit: string;
  price?: number;
  cost?: number;
  minStock?: number;
  stock?: number;
}

// Empty number inputs are sent as "missing" so the API answers with a field error instead of a silent 0.
const num = (v: string) => (v.trim() === '' ? undefined : Number(v));

interface Props {
  product?: Product; // edit mode when present
  readOnly?: boolean;
  onSubmit: (payload: ProductPayload) => Promise<unknown>;
  submitLabel: string;
  extraActions?: React.ReactNode;
}

/** Fields of S07 (US-10 AC1). Initial stock only on create; afterwards stock changes through adjustments. */
export default function ProductForm({ product, readOnly, onSubmit, submitLabel, extraActions }: Props) {
  const creating = !product;
  const form = useForm(
    {
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      category: product?.category ?? 'groceries',
      unit: product?.unit ?? 'unit',
      price: product ? String(product.price) : '',
      cost: product ? String(product.cost) : '',
      minStock: product ? String(product.minStock) : '5',
      stock: '0',
    },
    (v) =>
      onSubmit({
        name: v.name,
        sku: v.sku,
        category: v.category,
        unit: v.unit,
        price: num(v.price),
        cost: num(v.cost) ?? 0,
        minStock: num(v.minStock),
        ...(creating ? { stock: num(v.stock) } : {}),
      }),
  );
  const field = (name: keyof typeof form.values) => ({
    name,
    value: form.values[name],
    onChange: form.onChange,
    error: form.errors[name],
    disabled: readOnly,
  });

  return (
    <form onSubmit={form.handleSubmit} noValidate className="space-y-4 card p-5">
      <FormAlert message={form.formError} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" {...field('name')} maxLength={80} />
        <TextField label="SKU" {...field('sku')} maxLength={30} hint="Unique code inside your store" />
        <SelectField
          label="Category"
          {...field('category')}
          options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
        />
        <SelectField label="Unit" {...field('unit')} options={UNITS.map((u) => ({ value: u, label: UNIT_LABEL[u] }))} />
        <TextField label="Sale price (COP)" type="number" inputMode="numeric" min={1} step={1} {...field('price')} />
        <TextField label="Cost (COP)" type="number" inputMode="numeric" min={0} step={1} {...field('cost')} />
        <TextField
          label="Minimum stock"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          {...field('minStock')}
          hint="You get a low-stock alert at or below this number"
        />
        {creating && (
          <TextField label="Initial stock" type="number" inputMode="numeric" min={0} step={1} {...field('stock')} />
        )}
      </div>
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={form.submitting}>
            {submitLabel}
          </Button>
          {extraActions}
        </div>
      )}
    </form>
  );
}
