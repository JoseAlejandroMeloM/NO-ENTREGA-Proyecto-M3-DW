import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';

const ROLE_LABEL: Record<string, string> = {
  store_owner: 'Store owner',
  store_inventory: 'Inventory clerk',
  store_cashier: 'Cashier',
  distributor_owner: 'Distributor owner',
  distributor_staff: 'Distributor staff',
};

/** Temporary home for /app and /dist until the dashboards (S05, S19) are built. */
export default function Home() {
  const { session, logout } = useAuth();
  if (!session) return null;
  const { user, organization } = session;
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-slate-500">{organization.name}</p>
      <h1 className="mt-1 text-2xl font-semibold">Hello, {user.name}</h1>
      <p className="mt-1 text-slate-600">
        Signed in as <strong>{ROLE_LABEL[user.role]}</strong> ({user.email}).
      </p>
      <p className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
        The dashboard for your role is coming in the next changes.
      </p>
      <Button variant="secondary" className="mt-6" onClick={logout}>
        Log out
      </Button>
    </main>
  );
}
