import { LoaderCircle } from 'lucide-react';

/** Shown while a list or page waits for its data. Announced politely to screen readers. */
export default function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-600">
      <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
      {label}
    </p>
  );
}
