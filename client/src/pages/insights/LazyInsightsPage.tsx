import { lazy, Suspense } from 'react';

// Loaded on first visit: keeps Recharts (≈100 kB gzip) out of the main bundle.
const InsightsPage = lazy(() => import('./InsightsPage'));

export default function LazyInsightsPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
      <InsightsPage />
    </Suspense>
  );
}
