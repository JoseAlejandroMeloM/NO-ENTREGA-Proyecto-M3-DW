import { Link } from 'react-router-dom';

/** S26 — friendly 404. */
export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist or was moved.</p>
      <Link to="/" className="mt-6 inline-block font-medium text-primary hover:underline">
        Back to home
      </Link>
    </main>
  );
}
