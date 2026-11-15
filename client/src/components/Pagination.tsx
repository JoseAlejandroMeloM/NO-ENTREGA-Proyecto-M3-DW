import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

interface Props {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

/** Previous / "Page 2 of 5" / Next. Renders nothing when there is a single page. */
export default function Pagination({ page, pages, onChange }: Props) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-end gap-2 text-sm">
      <Button variant="secondary" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft className="-ml-1 h-4 w-4" aria-hidden="true" />
        Previous
      </Button>
      <span className="px-1 text-slate-600 tabular-nums">
        Page {page} of {pages}
      </span>
      <Button variant="secondary" onClick={() => onChange(page + 1)} disabled={page >= pages}>
        Next
        <ChevronRight className="-mr-1 h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
