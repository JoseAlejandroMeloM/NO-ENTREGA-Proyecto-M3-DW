interface Props {
  /** Use on the deep-teal sidebar and auth panel. */
  onDark?: boolean;
  /** Mark only; the name stays available to screen readers. */
  compact?: boolean;
  className?: string;
}

/** Wordmark: two overlapping circles (a store and a distributor meeting) + the name. */
export default function Logo({ onDark = false, compact = false, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-display text-lg leading-none tracking-tight ${
        onDark ? 'text-white' : 'text-primary-dark'
      } ${className}`}
    >
      <svg viewBox="0 0 32 24" className="h-6 w-8 shrink-0" aria-hidden="true">
        <circle cx="10" cy="12" r="9" className={onDark ? 'fill-primary-soft' : 'fill-primary'} />
        <circle cx="22" cy="12" r="9" className="fill-accent" />
        <path d="M16 5.29a9 9 0 0 1 0 13.42 9 9 0 0 1 0-13.42Z" className={onDark ? 'fill-white' : 'fill-primary-dark'} />
      </svg>
      <span className={compact ? 'sr-only' : undefined}>
        <span className="font-bold">Conecta</span> <span className="font-medium">Negocio</span>
      </span>
    </span>
  );
}
