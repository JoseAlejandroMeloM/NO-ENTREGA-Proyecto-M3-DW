import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** "Back to the list" link shown above the title of detail and form pages. */
export default function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-1 text-sm font-medium text-primary-dark hover:underline">
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
      {children}
    </Link>
  );
}
