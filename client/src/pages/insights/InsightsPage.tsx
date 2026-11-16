import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSearchParams } from 'react-router-dom';
import FormAlert from '../../components/FormAlert';
import { useApi } from '../../hooks/useApi';
import type { BestSellers, DailySales, Days, ProductStat } from '../../types/insights';
import { formatCOP } from '../../utils/money';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';

const RANGES: Days[] = [7, 30, 90];
// Chart colors: the same values as the tokens in index.css (Recharts needs them as strings).
const CHART = {
  bar: '#0f766e',
  grid: '#e6e2db',
  cursor: '#d5efe9',
  tick: { fontSize: 12, fill: '#6e6960' },
  tooltip: { borderRadius: 12, border: '1px solid #e6e2db', boxShadow: '0 6px 16px -4px rgb(29 27 24 / 0.1)', fontSize: 13 },
};
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
        subtitle="Daily trend and best sellers."
        actions={
          <div className="inline-flex gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-card" role="radiogroup" aria-label="Range">
            {RANGES.map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={days === r}
                onClick={() => setParams({ days: String(r) }, { replace: true })}
                className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${days === r ? 'bg-primary-soft text-primary-dark' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                {r} days
              </button>
            ))}
          </div>
        }
      />

      <FormAlert message={daily.error ?? best.error} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={`Sales, last ${days} days`} value={daily.data ? formatCOP(total) : '–'} />
        <StatCard label="Number of sales" value={daily.data ? count : '–'} />
        <StatCard label="Average sale" value={daily.data ? formatCOP(count ? Math.round(total / count) : 0) : '–'} />
      </div>

      <div className="card p-4 sm:p-5">
        <h2 className="mb-4 font-semibold">Daily sales</h2>
        <div className="h-72">
          {daily.data && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily.data.data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={CHART.tick} tickLine={false} axisLine={{ stroke: CHART.grid }} minTickGap={24} />
                <YAxis tickFormatter={(v: number) => compact.format(v)} tick={CHART.tick} tickLine={false} axisLine={false} width={48} />
                <Tooltip
                  formatter={(v) => [formatCOP(Number(v)), 'Sales']}
                  labelFormatter={(l) => shortDate(String(l))}
                  cursor={{ fill: CHART.cursor }}
                  contentStyle={CHART.tooltip}
                  labelStyle={{ color: CHART.tick.fill, fontSize: 12 }}
                  itemStyle={{ color: '#1d1b18', fontWeight: 600 }}
                />
                {/* No draw-in animation: the numbers should be readable at once (and it respects reduced motion). */}
                <Bar dataKey="total" fill={CHART.bar} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
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
      {rows && rows.length === 0 && <p className="px-4 py-6 text-sm text-slate-600">No sales in this range.</p>}
      <ol className="divide-y divide-slate-100">
        {rows?.map((r, i) => (
          <li key={r.product} className="px-4 py-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate">
                <span className="mr-2 inline-block w-5 text-slate-500 tabular-nums">{i + 1}</span>
                {r.name}
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {measure === 'units' ? `${r.units} u` : formatCOP(r.revenue)}
              </span>
            </div>
            <div className="mt-1.5 ml-7 h-1.5 rounded-full bg-slate-100" aria-hidden>
              <div className={`h-1.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-primary/55'}`} style={{ width: `${max ? (r[measure] / max) * 100 : 0}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
