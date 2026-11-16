import { useState } from 'react';
import { post } from '../../api/client';
import { useForm } from '../../hooks/useForm';
import type { Sale } from '../../types/sale';
import Button from '../Button';
import FormAlert from '../FormAlert';
import TextField from '../TextField';

/** Owner-only "Void sale" in the S09 drawer (add-sale-voiding): confirm with a reason; stock comes back. */
export default function VoidSalePanel({ sale, onVoided }: { sale: Sale; onVoided: (sale: Sale) => void }) {
  const [confirming, setConfirming] = useState(false);
  const form = useForm({ reason: '' }, async ({ reason }) => {
    onVoided(await post<Sale>(`/sales/${sale.id}/void`, { reason: reason.trim() }));
  });

  if (!confirming) {
    return (
      <Button variant="secondary" className="mt-6 w-full" onClick={() => setConfirming(true)}>
        Void sale
      </Button>
    );
  }
  return (
    <form onSubmit={form.handleSubmit} noValidate className="mt-6 space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-4">
      <p className="text-sm text-red-900">
        Voiding returns every item to stock and removes this sale from today&apos;s totals and insights. It stays in the history, marked as voided.
      </p>
      <FormAlert message={form.formError} />
      <TextField
        name="reason"
        label="Reason"
        value={form.values.reason}
        error={form.errors.reason}
        onChange={form.onChange}
        placeholder="e.g. wrong product"
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={() => setConfirming(false)}>
          Keep sale
        </Button>
        <Button type="submit" variant="danger" className="flex-1" loading={form.submitting}>
          Void sale
        </Button>
      </div>
    </form>
  );
}
