import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABEL } from '../layouts/nav';

/** Temporary home for /app and /dist until the dashboards (S05, S19) are built. */
export default function Home() {
  const { session } = useAuth();
  if (!session) return null;
  const { user } = session;
  return (
    <>
      <h1 className="text-2xl font-semibold">Hello, {user.name}</h1>
      <p className="mt-1 text-slate-600">
        Signed in as <strong>{ROLE_LABEL[user.role]}</strong> ({user.email}).
      </p>
      {user.orgType === 'store' && <LowStockCard />}
      <p className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
        The dashboard for your role is coming in the next changes.
      </p>
    </>
  );
}

/** Low-stock card of S05 (US-12 AC2): count of products at or below their minimum, linked to the filtered list. */
function LowStockCard() {
  const { data } = useApi<{ total: number }>('/products?lowStock=true&limit=1');
  const count = data?.total;
  return (
    <Link
      to="/app/products?lowStock=true"
      className="mt-6 block max-w-xs rounded-xl border border-slate-200 bg-white p-4 hover:border-accent"
    >
      <p className="text-sm text-slate-600">Low-stock products</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${count ? 'text-amber-600' : 'text-slate-900'}`}>
        {count ?? '–'}
      </p>
      <p className="mt-1 text-xs text-primary">View list →</p>
    </Link>
  );
}
