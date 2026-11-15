import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSearchParams } from 'react-router-dom';
import FormAlert from '../../components/FormAlert';
import { useApi } from '../../hooks/useApi';
import type { BestSellers, DailySales, Days, ProductStat } from '../../types/insights';
import { formatCOP } from '../../utils/money';
import PageHeader from '../../components/PageHeader';

const RANGES: Days[] = [7, 30, 90];
const compact = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 });
const shortDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

/** S10 Insights (US-13): daily sales chart and top 10 by units / revenue. Loaded lazily (Recharts is large). */
export default function InsightsPage() {
  const [params, setParams] = useSearchParams();
  const days = (RANGES.find((r) => String(r) === params.get('days')) ?? 30) as Days;
  const daily = useApi<DailySales>(`/insights/daily-sales?days=${days}`);
  const best = useApi<BestSellers>(`/insights/best-sellers?days=${days}`);
  const total = daily.data?.data.reduce((s, d) => s + d.total, 0) ?? 0;
  const count = daily.data?.data.reduce((s, d) => s + d.count, 0) ?? 0;

  return (
    <section className="space-y-4">
      <PageHeader
        title="Insights"
        subtitle={daily.data ? `${formatCOP(total)} in ${count} sales over the last ${days} days.` : 'Best sellers and daily trend.'}
        actions={
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5" role="radiogroup" aria-label="Range">
            {RANGES.map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={days === r}
                onClick={() => setParams({ days: String(r) }, { replace: true })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${days === r ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {r} days
              </button>
            ))}
          </div>
        }
      />

      <FormAlert message={daily.error ?? best.error} />

      <div className="card p-4">
        <h2 className="mb-3 font-semibold">Daily sales</h2>
        <div className="h-64">
          {daily.data && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily.data.data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12, fill: '#64748b' }} minTickGap={16} />
                <YAxis tickFormatter={(v: number) => compact.format(v)} tick={{ fontSize: 12, fill: '#64748b' }} width={48} />
                <Tooltip
                  formatter={(v) => [formatCOP(Number(v)), 'Sales']}
                  labelFormatter={(l) => shortDate(String(l))}
                  cursor={{ fill: '#ccfbf1' }}
                />
                <Bar dataKey="total" fill="#0f766e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopTable title="Top 10 by units" rows={best.data?.byUnits} measure="units" />
        <TopTable title="Top 10 by revenue" rows={best.data?.byRevenue} measure="revenue" />
      </div>
    </section>
  );
}

function TopTable({ title, rows, measure }: { title: string; rows?: ProductStat[]; measure: 'units' | 'revenue' }) {
  const max = rows?.[0]?.[measure] ?? 0;
  return (
    <div className="card">
      <h2 className="border-b border-slate-100 px-4 py-3 font-semibold">{title}</h2>
      {rows && rows.length === 0 && <p className="px-4 py-6 text-sm text-slate-500">No sales in this range.</p>}
      <ol className="divide-y divide-slate-100">
        {rows?.map((r, i) => (
          <li key={r.product} className="px-4 py-2 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate">
                <span className="mr-2 text-slate-400 tabular-nums">{i + 1}.</span>
                {r.name}
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {measure === 'units' ? `${r.units} u` : formatCOP(r.revenue)}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100" aria-hidden>
              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${max ? (r[measure] / max) * 100 : 0}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
