import { lazy, Suspense } from 'react';
import LoadingState from '../../components/LoadingState';

// Loaded on first visit: keeps Recharts (≈100 kB gzip) out of the main bundle.
const InsightsPage = lazy(() => import('./InsightsPage'));

export default function LazyInsightsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <InsightsPage />
    </Suspense>
  );
}
