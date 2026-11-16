interface Props<T> {
  /** Accessible name of the tab list, e.g. "Order status". */
  label: string;
  tabs: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}

/** Filter tabs above a list. One row that scrolls sideways on phones instead of wrapping. */
export default function Tabs<T extends string | boolean>({ label, tabs, value, onChange }: Props<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {tabs.map((t) => (
        <button
          key={String(t.value)}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`h-9 shrink-0 rounded-lg px-3 text-sm font-medium transition-colors -outline-offset-2 ${
            value === t.value ? 'bg-primary-soft text-primary-dark' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
