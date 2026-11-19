import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import type { DistributorInsights as Insights } from '../../types/insights';
import { formatCOP } from '../../utils/money';
import FormAlert from '../FormAlert';
import StatCard from '../StatCard';
import Tabs from '../Tabs';
import OrdersByStatus from './OrdersByStatus';
import TopItemsList from './TopItemsList';
import TopStoresList from './TopStoresList';

const RANGES = [
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
];
const percent = (rate: number | null) => (rate === null ? '–' : `${Math.round(rate * 100)}%`);
const hours = (h: number | null) => (h === null ? '–' : `${h} h`);

/** S19 extension: sales and service metrics for the distributor owner over the last 7, 30 or 90 days. */
export default function DistributorInsights() {
  const [range, setRange] = useState('30');
  const { data, error } = useApi<Insights>(`/distributor-insights?range=${range}`);

  return (
    <section className="space-y-4" aria-label="Insights">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Your results</h2>
        <Tabs label="Range" tabs={RANGES} value={range} onChange={setRange} />
      </div>
      <FormAlert message={error} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Delivered revenue" value={data ? formatCOP(data.deliveredRevenue) : '–'} hint={data && `${data.deliveredOrders} delivered ${data.deliveredOrders === 1 ? 'order' : 'orders'}`} />
        <StatCard label="Acceptance rate" value={data ? percent(data.acceptanceRate) : '–'} hint="Accepted out of the orders you decided on" />
        <StatCard label="Average delivery time" value={data ? hours(data.avgDeliveryHours) : '–'} hint="From accepting to delivering" />
        <OrdersByStatus counts={data?.ordersByStatus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopItemsList items={data?.topItems} />
        <TopStoresList stores={data?.topStores} />
      </div>
    </section>
  );
}
