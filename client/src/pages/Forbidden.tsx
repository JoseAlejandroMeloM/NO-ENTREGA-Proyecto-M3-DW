import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { homeFor } from '../types/auth';

/** S26 — 403 page for users without the role a screen requires. */
export default function Forbidden() {
  const { session } = useAuth();
  const home = session ? homeFor(session.organization.type) : '/';
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-6xl font-bold text-primary">403</p>
      <h1 className="mt-4 text-xl font-semibold">You don't have access to this page</h1>
      <p className="mt-2 text-slate-600">Your role does not include this section. Ask your store or company owner.</p>
      <Link to={home} className="mt-6 inline-block font-medium text-primary hover:underline">
        Go to my home
      </Link>
    </main>
  );
}
