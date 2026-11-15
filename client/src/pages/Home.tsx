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
      <p className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
        The dashboard for your role is coming in the next changes.
      </p>
    </>
  );
}
