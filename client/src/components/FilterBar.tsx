import type { ReactNode } from 'react';

/** Row of search and filter controls above a list. Children are labeled inputs and selects (use the `field` class). */
export default function FilterBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div role="search" className={`card flex flex-wrap items-end gap-3 p-3 ${className}`}>
      {children}
    </div>
  );
}
