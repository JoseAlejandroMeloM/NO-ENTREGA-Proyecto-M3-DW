import { useState, type FormEvent } from 'react';
import { ApiError, post } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import type { DailySummary } from '../../types/sale';
import { formatCOP } from '../../utils/money';
import Button from '../Button';
import FormAlert from '../FormAlert';
import TextField from '../TextField';

interface Closing {
  id: string;
  date: string;
  expectedCash: number;
  countedCash: number;
  difference: number;
  note: string | null;
}

const businessDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format();

export default function CashClosingPanel() {
  const [date, setDate] = useState(businessDate);
  const [openingFloat, setOpeningFloat] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Closing | null>(null);
  const history = useApi<Closing[]>('/closings');
  const summary = useApi<DailySummary>(date ? `/sales/summary/daily?date=${encodeURIComponent(date)}` : null);
  const totals = summary.data?.date === date ? summary.data.byMethod : null;
  const amount = (method: string) => totals?.find((row) => row.method === method)?.total ?? 0;
  const closed = saved?.date === date || history.data?.some((row) => row.date === date);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || closed || !totals || summary.loading || summary.error) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setSaving(true);
    setError(null);
    try {
      const result = await post<Closing>('/closings', {
        date,
        openingFloat: Number(openingFloat),
        countedCash: Number(fields.get('countedCash')),
        note: fields.get('note'),
      });
      setSaved(result);
      history.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not close the business day');
      if (err instanceof ApiError && err.status === 409) history.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card space-y-5 p-5" aria-labelledby="cash-closing-heading">
      <h2 id="cash-closing-heading" className="text-lg font-semibold">Close day</h2>
      <TextField
        label="Business date (Bogota)" name="closingDate" type="date" max={businessDate()}
        value={date} disabled={saving} onChange={(event) => {
          setDate(event.target.value);
          setOpeningFloat('0');
          setError(null);
        }}
      />
      {summary.loading && <p role="status" className="text-sm text-slate-600">Loading sales totals…</p>}
      <FormAlert message={summary.error} />
      {closed && <p role="status" className="text-sm text-slate-700">This business day is closed.</p>}
      {saved?.date === date && (
        <p role="status" className="text-sm font-medium">
          Closing saved. Difference: {formatCOP(saved.difference)}.
        </p>
      )}
      {!closed && totals && !summary.loading && !summary.error && (
        <form key={date} onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Opening float (COP)" name="openingFloat" type="number" min="0" step="1" required
              value={openingFloat} disabled={saving} onChange={(event) => setOpeningFloat(event.target.value)} />
            <TextField label="Counted cash (COP)" name="countedCash" type="number" min="0" step="1" required disabled={saving} />
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div><dt>Expected cash</dt><dd className="font-semibold">{formatCOP(Number(openingFloat) + amount('cash'))}</dd></div>
            <div><dt>Card sales</dt><dd className="font-semibold">{formatCOP(amount('card'))}</dd></div>
            <div><dt>Nequi sales</dt><dd className="font-semibold">{formatCOP(amount('nequi'))}</dd></div>
          </dl>
          <TextField label="Note (optional)" name="note" maxLength={200} disabled={saving} />
          <Button type="submit" loading={saving}>Save closing</Button>
        </form>
      )}
      <FormAlert message={error} />
      <div className="space-y-3">
        <h3 className="font-semibold">Closing history</h3>
        <FormAlert message={history.error} />
        {history.error && <Button type="button" variant="secondary" onClick={history.reload}>Retry history</Button>}
        {history.loading && <p role="status" className="text-sm text-slate-600">Loading closings…</p>}
        {history.data?.length === 0 && <p className="text-sm text-slate-600">No closings yet.</p>}
        {!!history.data?.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  {['Date', 'Expected', 'Counted', 'Difference', 'Note'].map((label) => (
                    <th className="p-2" key={label} scope="col">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.data.map((row) => (
                  <tr className="border-b last:border-0" key={row.id}>
                    <th scope="row" className="whitespace-nowrap p-2 font-medium">{row.date}</th>
                    <td className="whitespace-nowrap p-2">{formatCOP(row.expectedCash)}</td>
                    <td className="whitespace-nowrap p-2">{formatCOP(row.countedCash)}</td>
                    <td className={`whitespace-nowrap p-2 ${row.difference < 0 ? 'font-semibold text-red-700' : row.difference > 0 ? 'font-semibold text-amber-800' : ''}`}>
                      {formatCOP(row.difference)}
                    </td>
                    <td className="min-w-24 break-words p-2">{row.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
