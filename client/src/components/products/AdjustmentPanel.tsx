import { post } from '../../api/client';
import { NOTIFICATIONS_CHANGED } from '../../api/notifications';
import { useForm } from '../../hooks/useForm';
import { REASON_LABEL, UNIT_LABEL, type AdjustmentReason, type Product } from '../../types/product';
import Button from '../Button';
import FormAlert from '../FormAlert';
import SelectField from '../SelectField';
import TextField from '../TextField';

/** Stock adjustment on S07 (US-11): add or remove units with a reason. */
export default function AdjustmentPanel({ product, onAdjusted }: { product: Product; onAdjusted: () => void }) {
  const form = useForm({ direction: 'add', quantity: '', reason: 'count', note: '' }, async (v) => {
    const qty = v.quantity.trim() === '' ? undefined : Number(v.quantity);
    await post(`/products/${product.id}/adjustments`, {
      quantity: qty === undefined ? undefined : v.direction === 'remove' ? -qty : qty,
      reason: v.reason,
      ...(v.note.trim() ? { note: v.note.trim() } : {}),
    });
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED)); // a low-stock alert may have just been created
    onAdjusted();
  });

  return (
    <form onSubmit={form.handleSubmit} noValidate className="space-y-4 card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Adjust stock</h2>
        <p className="text-sm text-slate-600">
          Current: <strong className="tabular-nums">{product.stock}</strong> {UNIT_LABEL[product.unit]}
        </p>
      </div>
      <FormAlert message={form.formError} />
      <fieldset className="flex gap-4 text-sm">
        <legend className="sr-only">Direction</legend>
        {[
          { value: 'add', label: 'Add' },
          { value: 'remove', label: 'Remove' },
        ].map((d) => (
          <label key={d.value} className="flex items-center gap-2">
            <input
              type="radio"
              name="direction"
              value={d.value}
              checked={form.values.direction === d.value}
              onChange={form.onChange}
              className="accent-primary"
            />
            {d.label}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Quantity"
          name="quantity"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={form.values.quantity}
          onChange={form.onChange}
          error={form.errors.quantity}
        />
        <SelectField
          label="Reason"
          name="reason"
          value={form.values.reason}
          onChange={form.onChange}
          error={form.errors.reason}
          options={(Object.keys(REASON_LABEL) as AdjustmentReason[]).map((r) => ({ value: r, label: REASON_LABEL[r] }))}
        />
      </div>
      <TextField
        label="Note (optional)"
        name="note"
        value={form.values.note}
        onChange={form.onChange}
        error={form.errors.note}
        maxLength={200}
      />
      <Button type="submit" variant="secondary" loading={form.submitting}>
        Save adjustment
      </Button>
    </form>
  );
}
